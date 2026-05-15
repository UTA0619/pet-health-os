import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const MODEL_VERSION = "gpt-4o-2024-11-20";
const HUMAN_REVIEW_THRESHOLD = 0.4;

const ANALYSIS_SCHEMA = {
  type: "object" as const,
  properties: {
    coat_condition: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
    eye_clarity: { type: "string", enum: ["clear", "mild_discharge", "significant_discharge", "cloudy"] },
    posture: { type: "string", enum: ["normal", "slightly_hunched", "hunched", "lying_flat"] },
    mobility: { type: "string", enum: ["normal", "slightly_limited", "limited", "unable_to_assess"] },
    visible_concerns: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    overall_status: { type: "string", enum: ["healthy", "monitor", "concerning", "urgent"] },
    recommendations: { type: "array", items: { type: "string" } },
    requires_vet_attention: { type: "boolean" },
    vet_urgency: { type: "string", enum: ["none", "routine", "soon", "immediate"] },
  },
  required: ["coat_condition", "eye_clarity", "posture", "confidence", "overall_status", "requires_vet_attention", "vet_urgency"],
};

const DISCLAIMER = "This analysis is AI-generated and not a veterinary diagnosis. Always consult your vet for medical decisions.";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.pet_id || !body?.image_url) {
    return new Response(JSON.stringify({ error: "pet_id and image_url required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { pet_id, image_url } = body;

  // Verify ownership
  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, species, breed")
    .eq("id", pet_id)
    .eq("owner_id", user.id)
    .single();

  if (!pet) {
    return new Response(JSON.stringify({ error: "Pet not found or access denied" }), { status: 403 });
  }

  // Rate limit check (via metadata table or Redis — simplified here)
  const { count } = await supabase
    .from("camera_analyses")
    .select("*", { count: "exact", head: true })
    .eq("pet_id", pet_id)
    .gte("analyzed_at", new Date(Date.now() - 86400000).toISOString());

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, features")
    .eq("user_id", user.id)
    .single();

  const dailyLimit = subscription?.plan === "free" ? 3 : 50;
  if ((count ?? 0) >= dailyLimit) {
    return new Response(
      JSON.stringify({ error: "Daily camera analysis limit reached. Upgrade to Pro for more." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const speciesContext = pet.breed ? `${pet.breed} ${pet.species}` : pet.species;
    const systemPrompt = `You are a veterinary health assistant analyzing a photo of a ${speciesContext} named ${pet.name}.
Assess visible health indicators from the image. Be conservative — only report what you can clearly see.
IMPORTANT: You are NOT diagnosing. You are observing. Never use language like "diagnosed with" or "prescribed".
Always append: "${DISCLAIMER}"`;

    const response = await openai.chat.completions.create(
      {
        model: MODEL_VERSION,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `<system>${systemPrompt}</system>\n<request>Analyze the health of ${pet.name} in this image. Return a JSON object matching the schema exactly.</request>`,
              },
              {
                type: "image_url",
                image_url: { url: image_url, detail: "high" },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
        temperature: 0.1,
      },
      { timeout: 15000 }
    );

    const rawFindings = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    const confidence: number = rawFindings.confidence ?? 0;
    const flaggedForReview = confidence < HUMAN_REVIEW_THRESHOLD;

    const { data: analysis, error: insertError } = await supabase
      .from("camera_analyses")
      .insert({
        pet_id,
        image_url,
        findings: rawFindings,
        overall_status: rawFindings.overall_status ?? "monitor",
        confidence,
        flagged_for_review: flaggedForReview,
        review_reason: flaggedForReview ? `Low confidence: ${confidence}` : null,
        model_version: MODEL_VERSION,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Trigger anomaly detection if concerning finding
    if (rawFindings.overall_status === "concerning" || rawFindings.overall_status === "urgent") {
      await supabase.functions.invoke("run-anomaly-detection", {
        body: { pet_id, trigger: "camera_analysis", analysis_id: analysis.id },
      });
    }

    return new Response(
      JSON.stringify({ analysis, disclaimer: DISCLAIMER }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(JSON.stringify({ error: String(err), pet_id, user_id: user.id }));
    return new Response(
      JSON.stringify({ error: "Analysis failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

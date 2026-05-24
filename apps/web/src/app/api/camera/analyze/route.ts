import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { trackEvent, EVENTS } from "@/lib/analytics";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check subscription tier for rate limit
  const today = new Date().toISOString().slice(0, 10);
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .maybeSingle();

  const isPro = subscription?.tier === "pro";
  const dailyLimit = isPro ? 50 : 10;

  const limitResult = await rateLimit(
    `${user.id}:camera:${today}`,
    dailyLimit,
    24 * 60 * 60 * 1000
  );

  if (!limitResult.success) {
    logger.warn("camera_analyze_rate_limited", {
      user_id: user.id,
      tier: isPro ? "pro" : "free",
      reset_at: limitResult.resetAt,
    });
    return NextResponse.json(
      { error: "Daily camera analysis limit reached", resetAt: limitResult.resetAt },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(dailyLimit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limitResult.resetAt / 1000)),
          "Retry-After": String(Math.ceil((limitResult.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const formData = await request.formData();
  const petId = formData.get("pet_id") as string;
  const file = formData.get("file") as File;
  const locale = (formData.get("locale") as string) ?? "ja";
  const isEnglish = locale === "en";

  if (!petId || !file) {
    return NextResponse.json({ error: "pet_id and file are required" }, { status: 400 });
  }

  // Verify ownership
  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, species")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .single();

  if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

  // File size check
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  // Convert to base64 for OpenAI
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    // Return mock analysis if no API key (for development)
    return NextResponse.json({
      analysis: isEnglish ? {
        coat_condition: "Good condition",
        eye_clarity: "Clear and bright",
        posture: "Normal",
        mobility: "Active",
        visible_concerns: [],
        confidence: 0.85,
        recommendations: ["Maintain current care routine", "Continue regular health check-ups"],
        requires_vet_attention: false,
      } : {
        coat_condition: "良好",
        eye_clarity: "澄んでいる",
        posture: "正常",
        mobility: "活発",
        visible_concerns: [],
        confidence: 0.85,
        recommendations: ["現在の状態を維持してください", "定期的な健康チェックを続けましょう"],
        requires_vet_attention: false,
      }
    });
  }

  const lang = isEnglish ? "English" : "Japanese";
  const prompt = `You are a veterinary AI assistant analyzing a photo of a ${pet.species} named ${pet.name}.
Analyze the pet's visible health indicators and respond ONLY with a JSON object (no markdown, no explanation):
{
  "coat_condition": "brief assessment in ${lang} (1-2 sentences)",
  "eye_clarity": "brief assessment in ${lang} (1-2 sentences)",
  "posture": "brief assessment in ${lang} (1-2 sentences)",
  "mobility": "assessment based on visible posture/position in ${lang}",
  "visible_concerns": ["array of concerns in ${lang}, empty if none"],
  "confidence": 0.0-1.0,
  "recommendations": ["array of recommendations in ${lang}, 2-3 items"],
  "requires_vet_attention": true/false
}

IMPORTANT:
- Respond ONLY with the JSON object, nothing else
- All text values must be in ${lang}
- Be conservative - only flag vet attention for clearly visible issues
- Never provide a diagnosis, only observations`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "low",
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      // Try to extract JSON from the response
      const match = content.match(/\{[\s\S]*\}/);
      analysis = match ? JSON.parse(match[0]) : null;
    }

    if (!analysis) throw new Error("Failed to parse AI response");

    // Save to camera_analyses table
    await supabase.from("camera_analyses").insert({
      pet_id: petId,
      analyzed_at: new Date().toISOString(),
      findings: analysis,
      confidence: analysis.confidence ?? 0.7,
      model_version: "gpt-4o",
      flagged_for_review: (analysis.confidence ?? 1) < 0.5,
    }).select().single();

    logger.info("camera_scan_completed", {
      user_id: user.id,
      pet_id: petId,
      confidence: analysis.confidence,
      requires_vet_attention: analysis.requires_vet_attention,
    });

    trackEvent(EVENTS.CAMERA_SCAN_COMPLETED, {
      pet_id: petId,
      confidence: analysis.confidence,
      requires_vet_attention: analysis.requires_vet_attention,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    logger.error("camera_analysis_error", { user_id: user.id, error: String(error) });
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

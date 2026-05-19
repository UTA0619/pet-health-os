import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const petId = formData.get("pet_id") as string;
  const file = formData.get("file") as File;

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
      analysis: {
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

  const prompt = `You are a veterinary AI assistant analyzing a photo of a ${pet.species} named ${pet.name}.
Analyze the pet's visible health indicators and respond ONLY with a JSON object (no markdown, no explanation):
{
  "coat_condition": "brief assessment in Japanese (1-2 sentences)",
  "eye_clarity": "brief assessment in Japanese (1-2 sentences)",
  "posture": "brief assessment in Japanese (1-2 sentences)",
  "mobility": "assessment based on visible posture/position in Japanese",
  "visible_concerns": ["array of concerns in Japanese, empty if none"],
  "confidence": 0.0-1.0,
  "recommendations": ["array of recommendations in Japanese, 2-3 items"],
  "requires_vet_attention": true/false
}

IMPORTANT:
- Respond ONLY with the JSON object, nothing else
- All text values must be in Japanese
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

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Camera analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

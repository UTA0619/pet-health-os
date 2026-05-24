import { filterMedicalDiagnoses } from "@/lib/ai/guardrails";
import { logger } from "@/lib/logger";
import { getPrompt, PROMPT_VERSION } from "./prompts";

// ---------------------------------------------------------------------------
// In-memory cache with 24h TTL
// ---------------------------------------------------------------------------

interface CacheEntry {
  explanation: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string): string | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.explanation;
}

function setCached(key: string, explanation: string): void {
  cache.set(key, { explanation, expiresAt: Date.now() + TTL_MS });
}

// ---------------------------------------------------------------------------
// Core explanation generator
// ---------------------------------------------------------------------------

/**
 * Generate a short Japanese natural-language explanation for a single
 * health-score metric that is below threshold.
 *
 * @param petId    - Unique pet identifier (used for cache key)
 * @param petName  - Display name of the pet
 * @param metric   - Metric key (e.g. "appetite")
 * @param score    - Computed 0-100 score for the metric
 * @param value    - Raw logged value (1-5 scale)
 * @param scoreDate - ISO date string (YYYY-MM-DD) used for cache key
 */
export async function generateExplanation(
  petId: string,
  petName: string,
  metric: string,
  score: number,
  value: number,
  scoreDate: string,
): Promise<string> {
  const cacheKey = `${petId}-${metric}-${scoreDate}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    logger.warn("explainability_no_api_key", { petId, metric });
    const fallback = `${petName}の${metric}スコアは${score}/100です。引き続き観察を続けましょう。`;
    setCached(cacheKey, fallback);
    return fallback;
  }

  const systemPrompt = getPrompt("HEALTH_SCORE_EXPLAINER");

  const userPrompt =
    `In 1 warm sentence in Japanese, explain why ${petName}'s ${metric} score is ${score}/100 ` +
    `(raw value: ${value}/5) and what it means for their wellbeing. ` +
    `Be encouraging but honest. Do NOT give medical diagnoses.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 150,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const explanation = filterMedicalDiagnoses(raw);

    setCached(cacheKey, explanation);

    logger.info("explainability_generated", { petId, metric, score, promptVersion: PROMPT_VERSION.HEALTH_SCORE_EXPLAINER });

    return explanation;
  } catch (error) {
    logger.error("explainability_error", { petId, metric, error: String(error) });
    const fallback = `${petName}の${metric}スコアは${score}/100です。日々の観察を続けてあげましょう。`;
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Batch generator — only explains components below threshold
// ---------------------------------------------------------------------------

const THRESHOLD = 70;

/**
 * Generate explanations for all health-score components below the threshold
 * (score < 70).
 *
 * @param petId      - Unique pet identifier
 * @param petName    - Display name of the pet
 * @param components - Map of metric -> 0-100 score
 * @param scoreDate  - ISO date string (YYYY-MM-DD)
 * @returns          Map of metric -> Japanese explanation (only for low scores)
 */
export async function generateScoreExplanations(
  petId: string,
  petName: string,
  components: Record<string, number>,
  scoreDate: string,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const entries = Object.entries(components).filter(
    ([, score]) => score < THRESHOLD,
  );

  await Promise.all(
    entries.map(async ([metric, score]) => {
      // We don't have the raw value here; pass score as a proxy value
      // (callers who have the raw value should call generateExplanation directly)
      const explanation = await generateExplanation(
        petId,
        petName,
        metric,
        score,
        Math.round((score / 100) * 4 + 1), // approximate inverse of (value-1)/4*100
        scoreDate,
      );
      results[metric] = explanation;
    }),
  );

  return results;
}

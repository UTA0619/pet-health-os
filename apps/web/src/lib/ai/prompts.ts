// Semantic versioning for all AI prompts
// Increment version when prompt changes — never mutate in place

export const PROMPT_VERSION = {
  HEALTH_SCORE_EXPLAINER: "1.0.0",
  CAMERA_ANALYSIS: "1.0.0",
  ANOMALY_NARRATOR: "1.0.0",
} as const;

export type PromptVersion = typeof PROMPT_VERSION;

// Health score explainer prompts
export const HEALTH_SCORE_EXPLAINER_PROMPTS: Record<string, string> = {
  "1.0.0": `あなたはペットの健康アドバイザーです。以下のルールを厳守してください：
- 医療診断は行わない
- 温かく、励ましの口調で話す
- 1文で簡潔に説明する
- ペットの名前を使う
- 数値ではなく状態を説明する`,
};

// Camera analysis prompts
export const CAMERA_ANALYSIS_PROMPTS: Record<string, string> = {
  "1.0.0": `You are a pet health visual screener. Analyze this pet photo and return ONLY valid JSON.
CRITICAL: Do NOT provide medical diagnoses. Provide observations only.`,
};

// Anomaly narrator prompts
export const ANOMALY_NARRATOR_PROMPTS: Record<string, string> = {
  "1.0.0": `あなたはペット健康モニタリングシステムです。検知された異常を飼い主に分かりやすく説明してください。
医療診断は絶対に行わないでください。観察結果のみを報告してください。`,
};

// Feature flag: active prompt version per type (can be changed without deploy via env)
export function getActivePromptVersion(type: keyof PromptVersion): string {
  const envKey = `AI_PROMPT_VERSION_${type}`;
  return process.env[envKey] ?? PROMPT_VERSION[type];
}

export function getPrompt(type: keyof PromptVersion): string {
  const version = getActivePromptVersion(type);
  const prompts =
    type === "HEALTH_SCORE_EXPLAINER"
      ? HEALTH_SCORE_EXPLAINER_PROMPTS
      : type === "CAMERA_ANALYSIS"
        ? CAMERA_ANALYSIS_PROMPTS
        : ANOMALY_NARRATOR_PROMPTS;
  return prompts[version] ?? prompts["1.0.0"];
}

// Metadata logged with every AI call for evaluation tracking
export interface AICallMetadata {
  promptType: keyof PromptVersion;
  promptVersion: string;
  modelName: string;
  durationMs: number;
  success: boolean;
}

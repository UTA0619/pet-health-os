export const PROMPT_VERSIONS = {
  HEALTH_SCORE_EXPLAINER: '1.0.0',
  CAMERA_ANALYSIS: '1.2.0',
  ANOMALY_NARRATOR: '1.0.0',
} as const;

export type PromptType = keyof typeof PROMPT_VERSIONS;

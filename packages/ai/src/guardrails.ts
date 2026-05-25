export const MEDICAL_DISCLAIMER =
  "これは獣医師の診断ではありません。医療上の判断は必ず獣医師に相談してください。";

const BLOCKED_PHRASES = [
  "診断", "処方", "投薬してください", "病気です", "treatment prescribed",
  "diagnosed with", "prescribe", "you should give",
];

export function filterMedicalDiagnoses(text: string): string {
  let filtered = text;
  // Strip script tags first
  filtered = filtered.replace(/<script[\s\S]*?<\/script>/gi, '[filtered]');
  // Strip HTML tags
  filtered = filtered.replace(/<[^>]*>/g, '');
  // Block medical phrases
  for (const phrase of BLOCKED_PHRASES) {
    if (filtered.toLowerCase().includes(phrase.toLowerCase())) {
      filtered = filtered.replace(new RegExp(phrase, 'gi'), '[filtered]');
    }
  }
  return filtered;
}

export function appendDisclaimer(text: string): string {
  return `${text}\n\n${MEDICAL_DISCLAIMER}`;
}

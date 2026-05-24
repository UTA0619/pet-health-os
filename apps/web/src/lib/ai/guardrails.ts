export const MEDICAL_DISCLAIMER_JA =
  '※ このAI分析は参考情報であり、医療診断ではありません。ペットの健康に不安がある場合は、必ず獣医師にご相談ください。';

export const MEDICAL_DISCLAIMER_EN =
  'Disclaimer: This AI analysis is for informational purposes only and does not constitute medical diagnosis. If you have concerns about your pet\'s health, please consult a licensed veterinarian.';

const INJECTION_PATTERNS = [
  /ignore\s+previous/gi,
  /system\s*:/gi,
  /<script[\s\S]*?>/gi,
  /\{\{.*?\}\}/g,
  /\]\s*\(/g,
  /prompt\s*injection/gi,
  /ignore\s+instructions/gi,
  /disregard\s+(all|previous|above)/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(a\s+)?(?:doctor|vet(?:erinarian)?|medical)/gi,
];

export function sanitizeUserInput(text: string): string {
  let sanitized = text
    // Strip markdown formatting
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip HTML tags
    .replace(/<[^>]+>/g, '')
    .trim();

  // Block injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  // Limit to 500 characters
  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500);
  }

  return sanitized;
}

export function addMedicalDisclaimer(text: string, locale: 'ja' | 'en'): string {
  const disclaimer = locale === 'ja' ? MEDICAL_DISCLAIMER_JA : MEDICAL_DISCLAIMER_EN;
  return `${text}\n\n${disclaimer}`;
}

const DIAGNOSIS_PATTERNS_JA = [
  /診断[はがをもに]?/g,
  /処方[はがをもに]?/g,
  /と診断/g,
  /診断結果/g,
  /診断書/g,
];

const DIAGNOSIS_PATTERNS_EN = [
  /\bdiagnos(?:is|e[sd]|ing)\b/gi,
  /\bprescri(?:be[sd]?|ption|bing)\b/gi,
  /\bmedical\s+diagnosis\b/gi,
  /\bclinical\s+diagnosis\b/gi,
];

export function filterMedicalDiagnoses(text: string): string {
  let filtered = text;

  for (const pattern of DIAGNOSIS_PATTERNS_JA) {
    filtered = filtered.replace(pattern, '[情報提供のみ]');
  }

  for (const pattern of DIAGNOSIS_PATTERNS_EN) {
    filtered = filtered.replace(pattern, '[informational only]');
  }

  return filtered;
}

const DIRECT_COMPLETION_PATTERNS = [
  /\b(write|do|complete|finish|answer|solve)\b.{0,55}\b(my|this|the)\b.{0,55}\b(homework|assignment|coursework|assessment|schoolwork|worksheet|nea|individual project|task)\b/i,
  /\bwrite\s+(?:me\s+)?(?:an?\s+|the\s+|my\s+)?(?:essay|paragraph|introduction|conclusion|response|answer)\b/i,
  /\banswer\s+(?:question|q)\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i,
  /\banswer\b.{0,35}\b(?:this|the|my)?\s*(?:question|worksheet|task)\b.{0,35}\bfor\s+me\b/i,
  /\bgive\s+me\s+(?:the\s+)?answer\b/i,
  /\brewrite\b.{0,65}\b(submit|submission|assignment|coursework|homework|assessment|schoolwork|answer|essay|paragraph|project)\b/i,
  /\b(make|turn)\b.{0,35}\b(this|my)\b.{0,35}\b(submission[- ]ready|ready\s+to\s+submit|sound\s+like\s+me)\b/i,
  /\bproduce\b.{0,45}\b(submission|coursework|assignment|homework|assessment|schoolwork)\b/i,
]

export const SAFE_SUPPORT_OPTIONS = [
  'Explain the topic or terminology I need.',
  'Explain what the question or task is asking me to do.',
  'Teach the knowledge I need in manageable steps.',
  'Quiz me one question at a time to check my understanding.',
  'Help me plan an approach without writing the answer.',
  'Give feedback on my understanding without rewriting my work.',
]

export function assessIntegrityRequest(value='') {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  const blocked = DIRECT_COMPLETION_PATTERNS.some(pattern => pattern.test(text))
  return {
    blocked,
    reason: blocked ? 'This looks like a request to complete or rewrite school or assessed work.' : null,
    safeReply: blocked
      ? 'I can help you learn and understand this, but I cannot write, complete, answer or rewrite school or assessed work for submission. I can explain the topic, unpack the question, teach the knowledge, quiz you, help you plan an approach, or give feedback on your understanding without producing the answer for you.'
      : null,
  }
}

import { LEARNING_CONTENT } from './learningContent.js'
import { LEARNING_DEPTH } from './learningDepth.js'
import { EXTRA_DEPTH } from './learningEnrichment.js'

function unique(items = []) {
  return [...new Set(items.filter(Boolean))]
}

for (const [subjectSlug, topics] of Object.entries(EXTRA_DEPTH)) {
  if (!LEARNING_DEPTH[subjectSlug]) LEARNING_DEPTH[subjectSlug] = {}
  for (const [topicSlug, extra] of Object.entries(topics)) {
    const current = LEARNING_DEPTH[subjectSlug][topicSlug] || {}
    LEARNING_DEPTH[subjectSlug][topicSlug] = {
      ...current,
      ...extra,
      spec: current.spec || extra.spec,
      depth: unique([...(current.depth || []), ...(extra.depth || [])]),
      evidence: unique([...(current.evidence || []), ...(extra.evidence || [])]),
      analysis: unique([...(current.analysis || []), ...(extra.analysis || [])]),
      exam: current.exam || extra.exam,
    }
  }
}

const law = LEARNING_CONTENT.law
if (law) {
  law.intro = 'Kellyn’s confirmed WJEC substantive Law areas are Criminal Law and Human Rights. Learn the rules, authorities and legal principles in depth, then practise applying and evaluating them without replacing Kellyn’s own assessed work.'
  law.units = (law.units || []).map(unit => ({
    ...unit,
    title: unit.slug === 'unit-3-4-substantive-law' ? 'Units 3 & 4 · Criminal Law and Human Rights' : unit.title,
    subtitle: unit.slug === 'unit-3-4-substantive-law' ? 'Confirmed route: Criminal Law and Human Rights. Unit 3 emphasises accurate application; Unit 4 develops analysis, perspectives and evaluation.' : unit.subtitle,
    topics: (unit.topics || []).filter(topic => !['contract-formation', 'contract-problems-remedies'].includes(topic.slug)),
  }))
}

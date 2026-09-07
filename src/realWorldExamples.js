import {examplesFor as legacyExamplesFor} from './realWorldExamplesLegacy.js'
import {LAW_REAL_WORLD_EXAMPLES} from './lawRealWorldExamples.js'
import {SOCIOLOGY_REAL_WORLD_EXAMPLES} from './sociologyRealWorldExamples.js'
import {HISTORY_REAL_WORLD_EXAMPLES} from './historyRealWorldExamples.js'

export function examplesFor(subjectSlug, topicSlug) {
  const lawRows = subjectSlug === 'law' ? LAW_REAL_WORLD_EXAMPLES[topicSlug] : null
  const sociologyRows = subjectSlug === 'sociology' ? SOCIOLOGY_REAL_WORLD_EXAMPLES[topicSlug] : null
  const historyRows = subjectSlug === 'history' ? HISTORY_REAL_WORLD_EXAMPLES[topicSlug] : null
  return lawRows || sociologyRows || historyRows || legacyExamplesFor(subjectSlug, topicSlug)
}

export function exampleFor(subjectSlug, topicSlug, index = 0) {
  const rows = examplesFor(subjectSlug, topicSlug)
  return rows.length ? rows[index % rows.length] : null
}

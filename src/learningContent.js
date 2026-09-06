import {LEARNING_CONTENT as BASE_LEARNING_CONTENT} from './learningContentLegacy.js'
export {LEARNING_STATUS} from './learningContentLegacy.js'

const lawBase = BASE_LEARNING_CONTENT.law
const lawUnits = (lawBase?.units || []).map(unit => {
  if (unit.slug !== 'unit-3-4-substantive-law') return unit
  return {
    ...unit,
    title: 'Units 3 & 4 · Criminal Law and Human Rights Law',
    subtitle: 'Kellyn’s confirmed Year 2 route. Unit 3 emphasises application; Unit 4 develops analysis, perspectives and evaluation.',
    topics: (unit.topics || []).filter(topic => !topic.slug.startsWith('contract-'))
  }
})

export const LEARNING_CONTENT = {
  ...BASE_LEARNING_CONTENT,
  law: {
    ...lawBase,
    intro: 'Kellyn’s confirmed A2 route is Criminal Law and Human Rights Law. Learn the legal rules in manageable sections, connect each rule to real cases and current examples, then practise Unit 3 application and Unit 4 evaluation.',
    units: lawUnits
  }
}

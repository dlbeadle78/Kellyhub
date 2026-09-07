import {LEARNING_CONTENT as BASE_LEARNING_CONTENT} from './learningContentLegacy.js'
export {LEARNING_STATUS} from './learningContentLegacy.js'

const sociologyBase = BASE_LEARNING_CONTENT.sociology
const sociologyUnits = (sociologyBase?.units || []).map(unit => {
  if (unit.slug === 'unit-3-power-control') {
    return {
      ...unit,
      title: 'Unit 3 · Power and Control: Crime and Deviance',
      subtitle: 'Kellyn’s confirmed Unit 3 option. Learn theories alongside named studies, current evidence and policy examples.',
      note: 'Crime and Deviance is Kellyn’s confirmed option. Use specific sociological evidence and current examples rather than unsupported anecdotes.'
    }
  }
  if (unit.slug === 'unit-4-inequality-methods') {
    return {
      ...unit,
      title: 'Unit 4 · Social Inequality and Applied Methods',
      subtitle: 'Compulsory applied research methods plus contemporary patterns and explanations of social inequality.'
    }
  }
  return unit
})

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
  sociology: {
    ...sociologyBase,
    intro: 'Kellyn’s Year 13 Sociology route is Unit 3 Crime and Deviance plus Unit 4 Social Inequality and Applied Methods. Learn each idea with named sociologists, specific studies, current official evidence and Welsh real-world examples, then practise explaining what the evidence supports, challenges or cannot prove.',
    units: sociologyUnits
  },
  law: {
    ...lawBase,
    intro: 'Kellyn’s confirmed A2 route is Criminal Law and Human Rights Law. Learn the legal rules in manageable sections, connect each rule to real cases and current examples, then practise Unit 3 application and Unit 4 evaluation.',
    units: lawUnits
  }
}

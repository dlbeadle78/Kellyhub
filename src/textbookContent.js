import { TEXTBOOK_CONTENT as BASE_TEXTBOOK_CONTENT, SUBJECT_ASSESSMENT_LINKS } from './textbookContentBase.js'
import { CONTRACT_TEXTBOOK_CONTENT } from './contractTextbookContent.js'

export const TEXTBOOK_CONTENT = {
  ...BASE_TEXTBOOK_CONTENT,
  law: {
    ...(BASE_TEXTBOOK_CONTENT.law || {}),
    ...CONTRACT_TEXTBOOK_CONTENT
  }
}

export { SUBJECT_ASSESSMENT_LINKS }

export function textbookFor(subjectSlug, topicSlug) {
  return TEXTBOOK_CONTENT?.[subjectSlug]?.[topicSlug] || null
}

export const COMMAND_WORDS = {
  identify: { label: 'Identify', simple: 'Pick out and name the relevant point or feature.', cue: 'What exactly do I need to name or select?' },
  outline: { label: 'Outline', simple: 'Give the main features or stages without going into full detail.', cue: 'What are the essential points in the right order?' },
  describe: { label: 'Describe', simple: 'Give a clear account of what something is like or what happens.', cue: 'What are the relevant features, facts or characteristics?' },
  explain: { label: 'Explain', simple: 'Show how or why something happens by giving reasons and making links.', cue: 'What is the reason, and how does it lead to the result?' },
  analyse: { label: 'Analyse', simple: 'Break the issue into parts and examine relationships, evidence or consequences.', cue: 'What are the parts, how are they connected, and what does the evidence show?' },
  compare: { label: 'Compare', simple: 'Examine similarities and differences using the same points of comparison.', cue: 'What is similar, what is different, and which comparison matters most?' },
  discuss: { label: 'Discuss', simple: 'Consider more than one relevant view or argument and reach a reasoned position.', cue: 'What are the main views, what supports them, and where does the balance of evidence lead?' },
  assess: { label: 'Assess', simple: 'Judge how important, effective or convincing something is using evidence and clear criteria.', cue: 'What evidence supports each side, and how strong is it overall?' },
  evaluate: { label: 'Evaluate', simple: 'Judge strengths and limitations, weigh evidence and reach a supported conclusion.', cue: 'What works, what is limited, and what is my reasoned judgement?' }
}

const ORDER = ['evaluate','analyse','assess','discuss','compare','explain','describe','outline','identify']

export function identifyCommandWord(text = '') {
  const normal = String(text).toLowerCase()
  const key = ORDER.find(word => new RegExp(`\\b${word}(?:d|s|ing)?\\b`, 'i').test(normal))
  return key ? { key, ...COMMAND_WORDS[key] } : null
}

export function understandTask(text = '') {
  const command = identifyCommandWord(text)
  if (!String(text).trim()) return {
    command: null,
    simple: 'Add or paste the teacher instruction so Kellyn Hub can help unpack what it is asking.',
    parts: ['Read the task or brief.', 'Find the exact instruction from the teacher.', 'Add it to the task details.']
  }
  const simple = command
    ? `The command word is ${command.label}. In simple terms: ${command.simple}`
    : 'No clear command word was detected. Read the instruction for the action Kellyn is being asked to take and check any teacher guidance.'
  return {
    command,
    simple,
    parts: command ? taskParts(command.key) : ['Identify the subject or topic.', 'Find the action the task asks for.', 'Check whether there is more than one part.', 'Find the first useful action.']
  }
}

function taskParts(command) {
  const map = {
    identify: ['Work out exactly what needs naming.', 'Find the relevant information.', 'Select only the points that answer the instruction.'],
    outline: ['Find the main points or stages.', 'Put them in a sensible order.', 'Keep detail focused on the essentials.'],
    describe: ['Identify the relevant features or facts.', 'Choose accurate supporting detail.', 'Organise the description clearly.'],
    explain: ['Identify the main reasons or factors.', 'For each one, show how or why it leads to an outcome.', 'Support the explanation with relevant evidence or examples.'],
    analyse: ['Break the issue into relevant parts.', 'Examine relationships, causes, consequences or evidence.', 'Use evidence to show what those relationships mean.'],
    compare: ['Choose shared points of comparison.', 'For each point, state a similarity and/or difference.', 'Explain which differences or similarities are most significant where required.'],
    discuss: ['Identify the main relevant viewpoints or arguments.', 'Add evidence for each.', 'Test the arguments against each other.', 'Reach a reasoned position.'],
    assess: ['Decide the criteria for judging the issue.', 'Gather evidence for stronger and weaker aspects.', 'Weigh the evidence rather than listing it.', 'Reach a supported overall judgement.'],
    evaluate: ['Identify strengths and limitations.', 'Use evidence or authority to test each point.', 'Consider a counterargument where relevant.', 'Reach a supported judgement linked to the question.']
  }
  return map[command] || []
}

export function buildSafeSteps(task) {
  const text = `${task?.title || ''}. ${task?.description || ''}`
  const command = identifyCommandWord(text)
  const baseStart = [
    'Open the task and read the full instruction once.',
    command ? `Find the command word “${command.label}” and remind yourself what it means.` : 'Underline or note the action words in the instruction.',
    'Check whether the task has more than one part and what evidence or resources you need.'
  ]
  const middle = {
    identify: ['Find the information that directly matches the instruction.', 'Select the relevant points in your own words.'],
    outline: ['List the essential points or stages.', 'Put the points into a clear order.'],
    describe: ['List the relevant features or facts.', 'Add accurate supporting detail from your notes or sources.'],
    explain: ['Choose the main reasons or factors.', 'For each point, add the how/why link.', 'Add relevant evidence or examples.'],
    analyse: ['Break the issue into parts.', 'Add evidence to each part.', 'Explain relationships, causes, consequences or significance.'],
    compare: ['Choose shared comparison headings.', 'Add similarities and differences under each heading.', 'Decide which comparisons are most important.'],
    discuss: ['List the main views or arguments.', 'Add supporting evidence to each.', 'Test the arguments against each other before deciding your position.'],
    assess: ['Choose the criteria you will use to judge the issue.', 'Add evidence for stronger and weaker aspects.', 'Weigh the evidence and decide your overall judgement.'],
    evaluate: ['List the strongest points and limitations.', 'Support them with evidence or authority.', 'Consider a counterargument.', 'Decide your supported judgement.']
  }[command?.key] || ['Gather the relevant notes, sources or teacher guidance.', 'Make a short plan in your own words.']

  return [
    ...baseStart,
    ...middle,
    'Complete the response yourself, one section at a time.',
    'Read the work against every part of the teacher instruction.',
    'Check spelling, punctuation, references and presentation where required.',
    'When you are satisfied it is your own completed work, submit it to your teacher.'
  ]
}

export const BEFORE_SUBMISSION = [
  ['answered', 'I have answered every part of the question or instruction.'],
  ['own_work', 'This is my own work and reflects my own understanding.'],
  ['evidence', 'I have used the evidence, examples or authority I intended to use.'],
  ['spelling', 'I have checked spelling, punctuation and presentation.'],
  ['references', 'I have checked references where they are required.']
]

export function taskPriorityScore(task) {
  if (task?.status === 'completed') return -10000
  let score = Number(task?.priority || 2) * 10
  if (task?.status === 'nearly_finished') score += 35
  if (task?.status === 'changes_needed' || task?.status === 'feedback') score += 22
  if (task?.due_at) {
    const now = new Date(); now.setHours(0,0,0,0)
    const due = new Date(task.due_at); due.setHours(0,0,0,0)
    const days = Math.ceil((due - now) / 86400000)
    if (days <= 0) score += 60
    else if (days === 1) score += 50
    else if (days <= 3) score += 38
    else if (days <= 7) score += 24
    else if (days <= 14) score += 12
  }
  if (Number(task?.estimated_minutes || 0) <= 20) score += 4
  return score
}

import {assessIntegrityRequest} from '../src/assessmentIntegrity.js'

const blocked=[
  'Write my Sociology assignment.',
  'Answer question four for me.',
  'Rewrite this so I can submit it.',
  'Do my Law homework.',
  'Complete my assessment for me.',
  'Write me an essay I can hand in.',
]

const allowed=[
  'Explain labelling theory to me.',
  'Explain what this assignment question is asking me to do.',
  'Quiz me on criminal liability.',
  'Teach me how to evaluate a historical source.',
  'Help me plan how I should approach my homework without writing it.',
  'Give me feedback on whether I understand mens rea.',
]

let failed=false
for(const prompt of blocked){
  if(!assessIntegrityRequest(prompt).blocked){console.error(`FAIL expected block: ${prompt}`);failed=true}
}
for(const prompt of allowed){
  if(assessIntegrityRequest(prompt).blocked){console.error(`FAIL expected safe support: ${prompt}`);failed=true}
}
if(failed)process.exit(1)
console.log(`Assessment integrity regression passed: ${blocked.length} blocked, ${allowed.length} allowed.`)

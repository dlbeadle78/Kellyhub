import fs from 'node:fs'

const path='src/Phase4Library.jsx'
let text=fs.readFileSync(path,'utf8')

const importFrom="import {chunkKnowledge,suggestKnowledgeClassification,topicLabel,topicsForUnit,unitLabel,unitsForSubject} from './libraryKnowledge.js'\n"
const importTo=importFrom+"import AskLibraryPanel from './AskLibraryPanel.jsx'\n"
if(!text.includes("import AskLibraryPanel from './AskLibraryPanel.jsx'")){
  if(!text.includes(importFrom))throw new Error('Library knowledge import not found')
  text=text.replace(importFrom,importTo)
}

const marker='    </section>\n\n    <section className="library-purpose-grid">'
const replacement='    </section>\n\n    <AskLibraryPanel session={session} subjects={subjects} files={files} notify={notify}/>\n\n    <section className="library-purpose-grid">'
if(!text.includes('<AskLibraryPanel session={session}')){
  if(!text.includes(marker))throw new Error('Library hero marker not found')
  text=text.replace(marker,replacement)
}

fs.writeFileSync(path,text)

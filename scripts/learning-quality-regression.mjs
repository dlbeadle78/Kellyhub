import {LEARNING_CONTENT} from '../src/learningContent.js'
import {depthFor} from '../src/learningDepthGuide.js'
import {textbookFor} from '../src/textbookContent.js'
import {examplesFor} from '../src/realWorldExamples.js'

const issues=[]
let topicCount=0
for(const [subjectSlug,subject] of Object.entries(LEARNING_CONTENT)){
  for(const unit of subject.units||[]){
    for(const topic of unit.topics||[]){
      topicCount++
      const key=`${subjectSlug} / ${unit.slug} / ${topic.slug}`
      const depth=depthFor(subjectSlug,topic.slug)
      const textbook=textbookFor(subjectSlug,topic.slug)
      const examples=examplesFor(subjectSlug,topic.slug)
      if(String(topic.summary||'').length<100)issues.push(`${key}: summary too thin`)
      if((topic.keyIdeas||[]).length<3)issues.push(`${key}: fewer than 3 key ideas`)
      if((topic.terms||[]).length<3)issues.push(`${key}: fewer than 3 key terms`)
      if((topic.recall||[]).length<2)issues.push(`${key}: fewer than 2 retrieval checks`)
      if(!textbook||(textbook.sections||[]).length<2)issues.push(`${key}: fewer than 2 textbook sections`)
      if(!depth||(depth.depth||[]).length<2)issues.push(`${key}: deeper layer has fewer than 2 developed points`)
      if(!depth||(depth.evidence||[]).length<2)issues.push(`${key}: fewer than 2 named evidence/case items`)
      if(!depth||(depth.analysis||[]).length<2)issues.push(`${key}: exam analysis layer too thin`)
      if(examples.length<2)issues.push(`${key}: fewer than 2 grounded real-world examples`)
      for(const [index,example] of examples.entries()){
        if(!example.title||String(example.example||'').length<75||String(example.demonstrates||'').length<55)issues.push(`${key}: real example ${index+1} is incomplete`)
      }
    }
  }
}

if(issues.length){
  console.error(`Learning quality regression failed with ${issues.length} issue(s) across ${topicCount} topics:`)
  for(const issue of issues)console.error(`- ${issue}`)
  process.exit(1)
}
console.log(`Learning quality regression passed: ${topicCount} topics have core knowledge, deeper learning, evidence, exam thinking and grounded examples.`)

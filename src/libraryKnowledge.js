export const LIBRARY_STRUCTURE={
  sociology:{label:'Sociology',units:[
    {slug:'crime-deviance',label:'Crime and Deviance',topics:[
      {slug:'social-construction',label:'Social construction'},
      {slug:'labelling-theory',label:'Labelling theory'},
      {slug:'functionalism',label:'Functionalism and strain'},
      {slug:'marxism',label:'Marxism and crime'},
      {slug:'feminism',label:'Feminism and gender'},
      {slug:'moral-panics-media',label:'Media and moral panics'},
      {slug:'crime-statistics',label:'Crime statistics and patterns'},
      {slug:'crime-control',label:'Crime control and punishment'}
    ]},
    {slug:'social-inequality-applied-methods',label:'Social Inequality and Applied Methods',topics:[
      {slug:'class-inequality',label:'Social class inequality'},
      {slug:'gender-inequality',label:'Gender inequality'},
      {slug:'ethnicity-inequality',label:'Ethnicity and inequality'},
      {slug:'age-inequality',label:'Age and inequality'},
      {slug:'research-methods',label:'Applied research methods'}
    ]}
  ]},
  law:{label:'Law',units:[
    {slug:'a2-substantive-law',label:'A2 Substantive Law',topics:[
      {slug:'criminal-law',label:'Criminal law'},
      {slug:'human-rights-law',label:'Human rights law'},
      {slug:'contract-law',label:'Contract law'},
      {slug:'legal-application',label:'Applying substantive law'},
      {slug:'legal-evaluation',label:'Substantive law perspectives'}
    ]}
  ]},
  history:{label:'History',units:[
    {slug:'unit-3-option-8-american-century',label:'Unit 3 Option 8 - The American Century c.1890-1990',topics:[
      {slug:'civil-rights',label:'Civil rights'},
      {slug:'foreign-policy',label:'US foreign policy'},
      {slug:'cold-war',label:'The Cold War'},
      {slug:'economic-social-change',label:'Economic and social change'},
      {slug:'presidents-politics',label:'Presidents and politics'}
    ]},
    {slug:'unit-4-option-3-reform-protest',label:'Unit 4 Option 3 - Reform and Protest c.1832-1848',topics:[
      {slug:'reform-act',label:'Reform and political change'},
      {slug:'chartism',label:'Chartism'},
      {slug:'rebecca-riots',label:'Rebecca Riots'},
      {slug:'poor-law',label:'Poor Law and social protest'},
      {slug:'trade-unionism',label:'Trade unionism and protest'}
    ]},
    {slug:'unit-5-nea',label:'Unit 5 - NEA',topics:[
      {slug:'nea-question',label:'Question and planning'},
      {slug:'nea-sources',label:'Sources and interpretation'},
      {slug:'nea-research',label:'Research and referencing'},
      {slug:'nea-evaluation',label:'Analysis and evaluation'}
    ]}
  ]},
  'welsh-bacc':{label:'Advanced Skills Baccalaureate Wales',units:[
    {slug:'individual-project',label:'Individual Project',topics:[
      {slug:'aims-objectives',label:'Aim and objectives'},
      {slug:'research-planning',label:'Research planning'},
      {slug:'literature-review',label:'Literature review'},
      {slug:'primary-secondary-research',label:'Primary and secondary research'},
      {slug:'analysis-findings',label:'Analysis and findings'},
      {slug:'evaluation-reflection',label:'Evaluation and reflection'},
      {slug:'referencing',label:'Referencing and bibliography'}
    ]}
  ]}
}

const RULES=[
  {subject:'sociology',unit:'crime-deviance',topic:'social-construction',terms:['social construct','social construction','socially constructed','meaning is shaped','what counts as deviant','deviance varies']},
  {subject:'sociology',unit:'crime-deviance',topic:'labelling-theory',terms:['labelling theory','labeling theory','howard becker','edwin lemert','moral entrepreneur','primary deviance','secondary deviance','master status']},
  {subject:'sociology',unit:'crime-deviance',topic:'functionalism',terms:['durkheim','merton','strain theory','anomie','boundary maintenance','functionalism']},
  {subject:'sociology',unit:'crime-deviance',topic:'marxism',terms:['marxism','chambliss','criminogenic capitalism','selective enforcement','ruling class','white collar crime']},
  {subject:'sociology',unit:'crime-deviance',topic:'feminism',terms:['feminism','heidensohn','carlen','chivalry thesis','patriarchy','gender and crime']},
  {subject:'sociology',unit:'crime-deviance',topic:'moral-panics-media',terms:['moral panic','folk devils','stanley cohen','mods and rockers','deviancy amplification','media representation']},
  {subject:'sociology',unit:'crime-deviance',topic:'crime-statistics',terms:['official statistics','victim survey','crime survey','self report study','dark figure of crime','crime statistics']},
  {subject:'sociology',unit:'social-inequality-applied-methods',topic:'research-methods',terms:['research methods','sampling','questionnaire','interview','observation','validity','reliability','representative']},
  {subject:'law',unit:'a2-substantive-law',topic:'criminal-law',terms:['actus reus','mens rea','murder','manslaughter','theft','robbery','assault','battery','criminal law','offence','defence']},
  {subject:'law',unit:'a2-substantive-law',topic:'human-rights-law',terms:['human rights','echr','human rights act','article 2','article 3','article 5','article 6','article 8','article 10','article 11']},
  {subject:'law',unit:'a2-substantive-law',topic:'contract-law',terms:['contract law','offer','acceptance','consideration','intention to create legal relations','terms of contract','breach of contract','remedies']},
  {subject:'history',unit:'unit-3-option-8-american-century',topic:'civil-rights',terms:['civil rights','martin luther king','malcolm x','segregation','jim crow','brown v board','montgomery bus boycott']},
  {subject:'history',unit:'unit-3-option-8-american-century',topic:'cold-war',terms:['cold war','truman doctrine','marshall plan','cuban missile crisis','containment','soviet union','berlin blockade']},
  {subject:'history',unit:'unit-3-option-8-american-century',topic:'foreign-policy',terms:['foreign policy','vietnam war','korean war','isolationism','intervention','american foreign policy']},
  {subject:'history',unit:'unit-4-option-3-reform-protest',topic:'chartism',terms:['chartism','chartists','people’s charter','peoples charter','feargus o’connor','feargus oconnor','newport rising']},
  {subject:'history',unit:'unit-4-option-3-reform-protest',topic:'rebecca-riots',terms:['rebecca riots','rebecca rioters','toll gate','tollgate','turnpike','west wales protest']},
  {subject:'history',unit:'unit-4-option-3-reform-protest',topic:'poor-law',terms:['poor law','workhouse','poor law amendment act','outdoor relief']},
  {subject:'history',unit:'unit-5-nea',topic:'nea-sources',terms:['nea','non examined assessment','historical interpretation','source evaluation','primary source','secondary source']},
  {subject:'welsh-bacc',unit:'individual-project',topic:'literature-review',terms:['literature review','review of literature','academic literature','existing research']},
  {subject:'welsh-bacc',unit:'individual-project',topic:'aims-objectives',terms:['individual project','research aim','research aims','objectives','research question']},
  {subject:'welsh-bacc',unit:'individual-project',topic:'primary-secondary-research',terms:['primary research','secondary research','questionnaire','survey','interview','focus group']},
  {subject:'welsh-bacc',unit:'individual-project',topic:'analysis-findings',terms:['analysis of findings','research findings','analyse findings','data analysis','results']},
  {subject:'welsh-bacc',unit:'individual-project',topic:'evaluation-reflection',terms:['evaluate the project','project evaluation','reflection','strengths and limitations','limitations of research']},
  {subject:'welsh-bacc',unit:'individual-project',topic:'referencing',terms:['harvard referencing','bibliography','reference list','in text citation','citation']}
]

const SUBJECT_TERMS={
  sociology:['sociology','deviance','social inequality','functionalism','marxism','labelling','social construction'],
  law:['law','legal','criminal','contract','human rights','actus reus','mens rea'],
  history:['history','historical','chartism','rebecca riots','cold war','civil rights','american century'],
  'welsh-bacc':['welsh bacc','baccalaureate','individual project','research project','advanced skills baccalaureate']
}

function norm(value=''){return String(value||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim()}
function scoreTerms(text,terms=[]){return terms.reduce((score,term)=>text.includes(norm(term))?score+(term.includes(' ')?3:1):score,0)}

export function suggestKnowledgeClassification(text='',title='',subjectHint=null){
  const hay=norm(`${title} ${text}`)
  const subjectScores=Object.fromEntries(Object.keys(SUBJECT_TERMS).map(key=>[key,scoreTerms(hay,SUBJECT_TERMS[key])+(subjectHint===key?3:0)]))
  const bestSubject=Object.entries(subjectScores).sort((a,b)=>b[1]-a[1])[0]
  let subject=subjectHint||((bestSubject?.[1]||0)>0?bestSubject[0]:null)
  let bestRule=null,bestScore=0
  for(const rule of RULES){
    const score=scoreTerms(hay,rule.terms)+(subject===rule.subject?2:0)
    if(score>bestScore){bestRule=rule;bestScore=score}
  }
  if(bestRule&&bestScore>=3)subject=bestRule.subject
  const tags=[]
  if(bestRule){tags.push(bestRule.topic,bestRule.unit)}
  return {
    subject_slug:subject,
    unit_slug:bestRule&&bestScore>=3?bestRule.unit:null,
    topic_slug:bestRule&&bestScore>=3?bestRule.topic:null,
    tags:[...new Set(tags.filter(Boolean))],
    confidence:Math.min(.96,.35+(bestScore*.08)+(subject?0.12:0))
  }
}

export function unitsForSubject(subjectSlug){return LIBRARY_STRUCTURE[subjectSlug]?.units||[]}
export function topicsForUnit(subjectSlug,unitSlug){return unitsForSubject(subjectSlug).find(unit=>unit.slug===unitSlug)?.topics||[]}
export function unitLabel(subjectSlug,unitSlug){return unitsForSubject(subjectSlug).find(unit=>unit.slug===unitSlug)?.label||unitSlug||''}
export function topicLabel(subjectSlug,unitSlug,topicSlug){return topicsForUnit(subjectSlug,unitSlug).find(topic=>topic.slug===topicSlug)?.label||topicSlug||''}

export function chunkKnowledge(value,max=1600,overlap=120,maxChunks=600){
  const text=String(value||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()
  if(!text)return[]
  const chunks=[]
  let start=0
  while(start<text.length&&chunks.length<maxChunks){
    let end=Math.min(text.length,start+max)
    if(end<text.length){
      const paragraph=text.lastIndexOf('\n\n',end)
      const sentence=Math.max(text.lastIndexOf('. ',end),text.lastIndexOf('? ',end),text.lastIndexOf('! ',end))
      const space=text.lastIndexOf(' ',end)
      const cut=Math.max(paragraph>start+max*.55?paragraph:-1,sentence>start+max*.55?sentence+1:-1,space>start+max*.7?space:-1)
      if(cut>start)end=cut
    }
    const chunk=text.slice(start,end).trim()
    if(chunk)chunks.push(chunk)
    if(end>=text.length)break
    start=Math.max(end-overlap,start+1)
  }
  return chunks
}

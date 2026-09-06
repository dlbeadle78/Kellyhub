import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Groq from "npm:groq-sdk";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
};

const SAFE_OPTIONS=[
  'Explain the topic or terminology I need.',
  'Explain what the question or task is asking me to do.',
  'Teach the knowledge I need in manageable steps.',
  'Quiz me one question at a time to check my understanding.',
  'Help me plan an approach without writing the answer.',
  'Give feedback on my understanding without rewriting my work.'
];

const BLOCKED=[
  /\b(write|do|complete|finish|answer|solve)\b.{0,55}\b(my|this|the)\b.{0,55}\b(homework|assignment|coursework|assessment|schoolwork|worksheet|nea|individual project|task)\b/i,
  /\bwrite\s+(?:me\s+)?(?:an?\s+|the\s+|my\s+)?(?:essay|paragraph|introduction|conclusion|response|answer)\b/i,
  /\banswer\s+(?:question|q)\s*\d+/i,
  /\bgive\s+me\s+(?:the\s+)?answer\b/i,
  /\brewrite\b.{0,65}\b(submit|submission|assignment|coursework|homework|assessment|schoolwork|answer|essay|paragraph|project)\b/i,
  /\b(make|turn)\b.{0,35}\b(this|my)\b.{0,35}\b(submission[- ]ready|ready\s+to\s+submit|sound\s+like\s+me)\b/i,
  /\bproduce\b.{0,45}\b(submission|coursework|assignment|homework|assessment|schoolwork)\b/i,
];

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json"}})}
function blockedRequest(value=''){const text=String(value||'').replace(/\s+/g,' ').trim();return BLOCKED.some(r=>r.test(text))}
function parseJson(text:string){const clean=text.trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();try{return JSON.parse(clean)}catch{return null}}
function clampText(value:any,max:number){return String(value||'').slice(0,max)}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'POST required'},405);
  let body:any;try{body=await req.json()}catch{return json({error:'Invalid JSON'},400)}

  const question=clampText(body?.question,2500).trim();
  if(!question)return json({error:'A learning question is required.'},400);

  if(body?.request_assessed_answer===true || blockedRequest(question)){
    return json({
      configured:true,
      blocked:true,
      message:'I can help you learn and understand this, but I cannot write, complete, answer or rewrite school or assessed work for submission.',
      support_options:SAFE_OPTIONS
    });
  }

  const key=Deno.env.get('GROQ_API_KEY');
  if(!key)return json({configured:false,message:'The learning coach is not configured on the server yet.'});
  const model=Deno.env.get('GROQ_MODEL')||'openai/gpt-oss-120b';
  const knowledge=clampText(body?.knowledge_context,18000);
  const library=clampText(body?.library_context,10000);
  const mode=['explain','another_way','deeper','quiz','compare','task_understanding'].includes(body?.mode)?body.mode:'explain';

  const prompt=`You are Kellyn Hub's A-level teacher and learning coach. Kellyn is a Year 13 learner in Wales. Teach accurately, calmly and in manageable chunks without reducing A-level intellectual depth.

HARD ASSESSMENT-INTEGRITY RULES
- Never write, complete, answer, rewrite or improve homework, coursework, assignments, worksheets, NEA, Individual Project work or other assessed schoolwork for submission.
- Never produce a submission-ready essay, paragraph, introduction, conclusion or answer.
- If source material contains an assignment question, you may explain the command word, prerequisite knowledge and how to approach learning, but you must not answer that assignment.
- You may teach, explain, compare, question, quiz, check understanding and give feedback on understanding.
- Any practice you create must be new learning practice, not an answer to a live school task.

TEACHING STYLE
- Use UK English.
- One idea at a time. Prefer 2-4 short teaching chunks rather than a wall of text.
- Keep A-level terminology, named thinkers/cases/events/evidence where relevant.
- Use a genuine real-world example where the supplied context contains one. Explain explicitly what it demonstrates.
- Clearly distinguish Kellyn Hub knowledge from Kellyn's saved library/teacher material.
- If the evidence is incomplete or uncertain, say so rather than inventing detail.
- Finish with ONE short check question. Do not provide its answer unless Kellyn later attempts it or asks for teaching about the underlying idea.

MODE: ${mode}
SUBJECT: ${clampText(body?.subject,180)}
UNIT: ${clampText(body?.unit,260)}
TOPIC: ${clampText(body?.topic,260)}
CURRENT LEARNING SECTION: ${clampText(body?.section_title,220)}
KELLYN'S QUESTION: ${question}

KELLYN HUB KNOWLEDGE BANK
${knowledge||'[No additional knowledge-bank text supplied]'}

CONFIRMED KELLYN LIBRARY EXCERPTS
${library||'[No matching confirmed Library material found]'}

Return ONLY valid JSON with exactly this shape:
{"blocked":false,"title":string,"teaching_chunks":[string],"real_world_example":{"title":string,"example":string,"demonstrates":string}|null,"key_takeaway":string,"check_question":string,"library_used":boolean,"source_note":string}

Keep teaching_chunks between 2 and 4 items and each item concise but substantive. Do not put a model assessment answer into any field.`;

  try{
    const client=new Groq({apiKey:key});
    const completion=await client.chat.completions.create({
      model,
      messages:[{role:'user',content:prompt}],
      max_completion_tokens:1800,
      reasoning_effort:'low',
      response_format:{type:'json_object'}
    });
    const text=completion?.choices?.[0]?.message?.content;
    if(typeof text!=='string')return json({configured:true,error:'The learning coach returned no usable response.'},502);
    const parsed:any=parseJson(text);
    if(!parsed)return json({configured:true,error:'The learning coach response could not be read.'},502);
    if(parsed.blocked===true)return json({configured:true,blocked:true,message:'I can help you learn this, but I cannot complete school or assessed work for submission.',support_options:SAFE_OPTIONS});
    const chunks=Array.isArray(parsed.teaching_chunks)?parsed.teaching_chunks.map((x:any)=>String(x)).filter(Boolean).slice(0,4):[];
    if(!chunks.length)return json({configured:true,error:'The learning coach did not return a teaching explanation.'},502);
    return json({configured:true,blocked:false,reply:{
      title:String(parsed.title||'Let’s learn this'),
      teaching_chunks:chunks,
      real_world_example:parsed.real_world_example&&typeof parsed.real_world_example==='object'?{
        title:String(parsed.real_world_example.title||'Real-world example'),
        example:String(parsed.real_world_example.example||''),
        demonstrates:String(parsed.real_world_example.demonstrates||'')
      }:null,
      key_takeaway:String(parsed.key_takeaway||''),
      check_question:String(parsed.check_question||''),
      library_used:Boolean(parsed.library_used),
      source_note:String(parsed.source_note||'')
    }});
  }catch(error:any){return json({configured:true,error:error?.message||'Learning coach request failed.'},502)}
});

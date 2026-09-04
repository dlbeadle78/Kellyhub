import {createWorker} from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl

function cleanText(value=''){
  return String(value||'')
    .replace(/\u00ad/g,'')
    .replace(/[ \t]+/g,' ')
    .replace(/ ?\n ?/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim()
}

async function imageOcr(file,onProgress){
  onProgress?.({stage:'loading',percent:2,label:'Loading OCR…'})
  const worker=await createWorker('eng',undefined,{logger:m=>{
    if(m.status==='recognizing text')onProgress?.({stage:'ocr',percent:Math.max(4,Math.round((m.progress||0)*100)),label:`Reading image… ${Math.round((m.progress||0)*100)}%`})
    else if(m.status)onProgress?.({stage:'loading',percent:3,label:'Preparing OCR…'})
  }})
  try{
    const {data}=await worker.recognize(file)
    return {text:cleanText(data?.text),method:'image_ocr',pageCount:1,partial:false,note:null}
  }finally{await worker.terminate()}
}

async function pdfText(file,onProgress){
  const bytes=new Uint8Array(await file.arrayBuffer())
  const doc=await pdfjsLib.getDocument({data:bytes}).promise
  const pages=[]
  for(let pageNo=1;pageNo<=doc.numPages;pageNo++){
    onProgress?.({stage:'pdf',percent:Math.round((pageNo/doc.numPages)*75),label:`Reading PDF page ${pageNo} of ${doc.numPages}…`})
    const page=await doc.getPage(pageNo)
    const content=await page.getTextContent()
    const text=cleanText(content.items.map(item=>item.str||'').join(' '))
    if(text)pages.push(`Page ${pageNo}\n${text}`)
    page.cleanup?.()
  }
  const native=cleanText(pages.join('\n\n'))
  if(native.length>=Math.max(120,doc.numPages*18))return {text:native,method:'pdf_text',pageCount:doc.numPages,partial:false,note:null}

  const limit=Math.min(doc.numPages,30)
  onProgress?.({stage:'ocr',percent:4,label:'This PDF looks scanned. Starting OCR…'})
  const worker=await createWorker('eng',undefined,{logger:m=>{
    if(m.status==='recognizing text')onProgress?.({stage:'ocr',percent:Math.round((m.progress||0)*100),label:'Reading scanned page…'})
  }})
  const ocrPages=[]
  try{
    for(let pageNo=1;pageNo<=limit;pageNo++){
      onProgress?.({stage:'ocr',percent:Math.round(((pageNo-1)/limit)*100),label:`OCR page ${pageNo} of ${limit}…`})
      const page=await doc.getPage(pageNo)
      const viewport=page.getViewport({scale:1.5})
      const canvas=document.createElement('canvas')
      canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height)
      const context=canvas.getContext('2d',{alpha:false})
      await page.render({canvasContext:context,viewport}).promise
      const {data}=await worker.recognize(canvas)
      const text=cleanText(data?.text)
      if(text)ocrPages.push(`Page ${pageNo}\n${text}`)
      page.cleanup?.();canvas.width=1;canvas.height=1
    }
  }finally{await worker.terminate()}
  const partial=doc.numPages>limit
  return {text:cleanText(ocrPages.join('\n\n')),method:'pdf_ocr',pageCount:doc.numPages,partial,note:partial?`Scanned PDF OCR is limited to the first ${limit} pages in this version.`:null}
}

export async function extractFileText(file,onProgress){
  const type=(file.type||'').toLowerCase(),name=(file.name||'').toLowerCase()
  if(type.startsWith('image/'))return imageOcr(file,onProgress)
  if(type==='application/pdf'||name.endsWith('.pdf'))return pdfText(file,onProgress)
  if(type.startsWith('text/')||/\.(txt|md|csv)$/i.test(name)){
    onProgress?.({stage:'text',percent:90,label:'Reading text file…'})
    return {text:cleanText(await file.text()),method:'text_file',pageCount:null,partial:false,note:null}
  }
  throw new Error('This file type cannot be read automatically yet. Screenshots, images, PDFs and text files are supported.')
}

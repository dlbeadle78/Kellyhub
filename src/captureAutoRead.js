function supported(file){
  const type=(file?.type||'').toLowerCase()
  const name=(file?.name||'').toLowerCase()
  return type.startsWith('image/')||type==='application/pdf'||type.startsWith('text/')||/\.(pdf|png|jpe?g|webp|txt|md|csv)$/i.test(name)
}

export async function readCaptureFiles(files=[],onProgress){
  const readable=files.filter(supported)
  if(!readable.length)return {text:'',method:null,pageCount:null,note:'No automatically readable image, PDF or text file was attached.'}
  const {extractFileText}=await import('./libraryExtraction.js')
  const parts=[],methods=[],notes=[]
  let pages=0
  for(let index=0;index<readable.length;index++){
    const file=readable[index]
    onProgress?.(readable.length>1?`Reading ${index+1} of ${readable.length}: ${file.name}`:`Reading ${file.name}`)
    try{
      const result=await extractFileText(file,p=>onProgress?.(readable.length>1?`${index+1}/${readable.length} · ${p.label}`:p.label))
      if(result?.text)parts.push(`SOURCE: ${file.name}\n${result.text}`)
      if(result?.method)methods.push(result.method)
      if(result?.pageCount)pages+=result.pageCount
      if(result?.note)notes.push(result.note)
    }catch(error){notes.push(`${file.name}: ${error.message}`)}
  }
  return {
    text:parts.join('\n\n').trim(),
    method:[...new Set(methods)].join('+')||null,
    pageCount:pages||null,
    note:notes.join(' ')||null
  }
}

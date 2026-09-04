const HUB='https://kellyhub.vercel.app/'

function captureUrl(info,tab,extra={}){
  const params=new URLSearchParams()
  if(tab?.title)params.set('title',tab.title)
  if(info?.selectionText)params.set('text',info.selectionText)
  if(info?.linkUrl)params.set('url',info.linkUrl)
  else if(tab?.url)params.set('url',tab.url)
  for(const [key,value] of Object.entries(extra)) if(value!=null) params.set(key,String(value))
  return `${HUB}?${params.toString()}#/capture`
}

async function setupMenus(){
  await chrome.contextMenus.removeAll()
  chrome.contextMenus.create({id:'kellyn-screenshot',title:'Kellyn Hub → Capture screenshot',contexts:['page']})
  chrome.contextMenus.create({id:'kellyn-page',title:'Kellyn Hub → Add this page',contexts:['page']})
  chrome.contextMenus.create({id:'kellyn-selection',title:'Kellyn Hub → Add selected text',contexts:['selection']})
  chrome.contextMenus.create({id:'kellyn-link',title:'Kellyn Hub → Add this link',contexts:['link']})
}

chrome.runtime.onInstalled.addListener(()=>{setupMenus().catch(()=>{})})

function screenshotTokenFromUrl(url=''){
  try{return new URL(url).searchParams.get('screenshot')}catch{return null}
}

async function injectPendingScreenshot(tabId,token){
  if(!token)return false
  const key=`kellynScreenshot:${token}`
  const stored=await chrome.storage.local.get(key)
  const payload=stored[key]
  if(!payload?.dataUrl)return false
  try{
    const results=await chrome.scripting.executeScript({
      target:{tabId},
      func:async payload=>{
        const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
        let input=null
        for(let i=0;i<40;i++){
          input=document.querySelector('input.qc-hidden[type="file"]')
          if(input)break
          await sleep(250)
        }
        if(!input)return false
        const response=await fetch(payload.dataUrl)
        const blob=await response.blob()
        const file=new File([blob],`kellyn-hub-screenshot-${Date.now()}.jpg`,{type:blob.type||'image/jpeg'})
        const transfer=new DataTransfer()
        transfer.items.add(file)
        input.files=transfer.files
        input.dispatchEvent(new Event('change',{bubbles:true}))
        return true
      },
      args:[payload]
    })
    if(results?.[0]?.result){await chrome.storage.local.remove(key);return true}
  }catch{}
  return false
}

async function captureScreenshot(tab){
  if(!tab?.id)throw new Error('No active tab found.')
  const dataUrl=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'jpeg',quality:82})
  const token=crypto.randomUUID()
  const key=`kellynScreenshot:${token}`
  await chrome.storage.local.set({[key]:{dataUrl,createdAt:Date.now(),sourceUrl:tab.url||'',title:tab.title||'Page screenshot'}})
  const target=await chrome.tabs.create({url:captureUrl({},tab,{screenshot:token})})
  return target
}

chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab)=>{
  if(changeInfo.status!=='complete'||!tab?.url?.startsWith(HUB))return
  const token=screenshotTokenFromUrl(tab.url)
  if(token)injectPendingScreenshot(tabId,token).catch(()=>{})
})

chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
  if(message?.type!=='kellyn-capture-screenshot')return
  chrome.tabs.query({active:true,currentWindow:true})
    .then(([tab])=>captureScreenshot(tab))
    .then(()=>sendResponse({ok:true}))
    .catch(error=>sendResponse({ok:false,error:error?.message||'Screenshot capture failed.'}))
  return true
})

chrome.contextMenus.onClicked.addListener((info,tab)=>{
  if(info.menuItemId==='kellyn-screenshot'){
    captureScreenshot(tab).catch(()=>{})
    return
  }
  if(!['kellyn-page','kellyn-selection','kellyn-link'].includes(info.menuItemId))return
  chrome.tabs.create({url:captureUrl(info,tab)})
})

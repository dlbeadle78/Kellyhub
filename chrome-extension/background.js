const HUB='https://kellyhub.vercel.app/'
function captureUrl(info,tab){
  const params=new URLSearchParams()
  if(tab?.title)params.set('title',tab.title)
  if(info?.selectionText)params.set('text',info.selectionText)
  if(info?.linkUrl)params.set('url',info.linkUrl)
  else if(tab?.url)params.set('url',tab.url)
  return `${HUB}?${params.toString()}#/capture`
}
chrome.runtime.onInstalled.addListener(()=>{
  chrome.contextMenus.create({id:'kellyn-page',title:'Kellyn Hub → Add this page',contexts:['page']})
  chrome.contextMenus.create({id:'kellyn-selection',title:'Kellyn Hub → Add selected text',contexts:['selection']})
  chrome.contextMenus.create({id:'kellyn-link',title:'Kellyn Hub → Add this link',contexts:['link']})
})
chrome.contextMenus.onClicked.addListener((info,tab)=>{
  if(!['kellyn-page','kellyn-selection','kellyn-link'].includes(info.menuItemId))return
  chrome.tabs.create({url:captureUrl(info,tab)})
})

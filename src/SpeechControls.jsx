import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CirclePause, CirclePlay, Sparkles, Square, Volume2 } from 'lucide-react'
import { supabase } from './supabase.js'
import './speech.css'

const EDGE_VOICES = [
  { id: 'en-GB-SoniaNeural', label: 'Sonia', detail: 'British female' },
  { id: 'en-GB-LibbyNeural', label: 'Libby', detail: 'British female' },
  { id: 'en-GB-RyanNeural', label: 'Ryan', detail: 'British male' },
]

function saved(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch (_) { return fallback }
}

function splitText(value, maxChars = 300) {
  const clean = String(value || '')
    .replace(/\s*•\s*/g, '. ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return []
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean]
  const chunks = []
  let current = ''
  for (const raw of sentences) {
    const sentence = raw.trim()
    if (!sentence) continue
    if ((current + ' ' + sentence).trim().length <= maxChars) {
      current = (current + ' ' + sentence).trim()
      continue
    }
    if (current) chunks.push(current)
    current = ''
    if (sentence.length <= maxChars) {
      current = sentence
      continue
    }
    for (const word of sentence.split(/\s+/)) {
      if ((current + ' ' + word).trim().length > maxChars && current) {
        chunks.push(current)
        current = word
      } else {
        current = (current + ' ' + word).trim()
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function bestDeviceVoice(voices=[]) {
  const english = voices.filter(v => /^en/i.test(v.lang))
  const candidates = english.length ? english : voices
  const score = voice => {
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase()
    let value = /^en-gb/i.test(voice.lang) ? 40 : /^en/i.test(voice.lang) ? 20 : 0
    if (/natural|neural|online/.test(name)) value += 30
    if (/microsoft|google/.test(name)) value += 15
    if (/sonia|libby|ryan|hazel|george|susan/.test(name)) value += 10
    return value
  }
  return [...candidates].sort((a,b)=>score(b)-score(a))[0]
}

export default function SpeechControls({ text = '', getText, compact = false, label = 'Listen', contentKey = '' }) {
  const deviceSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [deviceVoices, setDeviceVoices] = useState([])
  const [deviceVoiceName, setDeviceVoiceName] = useState('')
  const [engine, setEngine] = useState(() => saved('kellyn-speech-engine-v3', 'edge') === 'device' ? 'device' : 'edge')
  const [edgeVoice, setEdgeVoice] = useState(() => saved('kellyn-edge-voice', 'en-GB-SoniaNeural'))
  const [rate, setRate] = useState(() => Number(saved('kellyn-speech-rate', '0.95')))
  const [state, setState] = useState('idle')
  const [statusText, setStatusText] = useState('')
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null)
  const requestRef = useRef(0)
  const chunksRef = useRef([])
  const indexRef = useRef(0)
  const tokenRef = useRef('')
  const fetchesRef = useRef(new Map())
  const abortsRef = useRef(new Set())
  const activeEngineRef = useRef(null)
  const utteranceRef = useRef(null)

  useEffect(() => {
    if (!deviceSupported) return
    const load = () => {
      const available = window.speechSynthesis.getVoices()
      setDeviceVoices(available)
      setDeviceVoiceName(current => {
        if (current && available.some(v => v.name === current)) return current
        return bestDeviceVoice(available)?.name || ''
      })
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load)
  }, [deviceSupported])

  useEffect(() => () => stop(false), [])

  // A learning section, topic, layer or dynamic teaching response has changed.
  // Stop obsolete speech immediately instead of continuing hidden/previous content.
  useEffect(() => {
    stop(false)
    setState('idle')
    setStatusText('')
  }, [contentKey])

  const englishDeviceVoices = useMemo(() => deviceVoices.filter(v => /^en/i.test(v.lang)), [deviceVoices])

  function content() {
    return String(typeof getText === 'function' ? getText() : text || '')
      .replace(/\s*•\s*/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function rememberRate(value) {
    const next = Number(value)
    stop(false)
    setState('idle')
    setStatusText('')
    setRate(next)
    try { localStorage.setItem('kellyn-speech-rate', String(next)) } catch (_) {}
  }

  function rememberEngine(value) {
    stop(false)
    setState('idle')
    setEngine(value)
    try { localStorage.setItem('kellyn-speech-engine-v3', value) } catch (_) {}
    setStatusText('')
  }

  function rememberEdgeVoice(value) {
    stop(false)
    setState('idle')
    setEdgeVoice(value)
    try { localStorage.setItem('kellyn-edge-voice', value) } catch (_) {}
    setStatusText('')
  }

  function clearAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  function cancelFetches() {
    for (const controller of abortsRef.current) controller.abort()
    abortsRef.current.clear()
    fetchesRef.current.clear()
  }

  function edgeChunk(requestId, index) {
    if (requestId !== requestRef.current || index >= chunksRef.current.length) return Promise.resolve(null)
    if (fetchesRef.current.has(index)) return fetchesRef.current.get(index)
    const controller = new AbortController()
    abortsRef.current.add(controller)
    const promise = fetch('/api/edge-tts', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}`},
      body: JSON.stringify({text: chunksRef.current[index], voice: edgeVoice, speed: rate}),
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error('Edge voice unavailable')
      return response.blob()
    }).finally(() => abortsRef.current.delete(controller))
    fetchesRef.current.set(index, promise)
    return promise
  }

  async function playEdgeChunk(requestId, index) {
    if (requestId !== requestRef.current) return
    if (index >= chunksRef.current.length) {
      setState('idle'); setStatusText(''); activeEngineRef.current = null; return
    }
    try {
      setState('loading')
      setStatusText(index === 0 ? 'Preparing natural voice…' : 'Preparing next part…')
      const blob = await edgeChunk(requestId, index)
      if (requestId !== requestRef.current || !blob) return
      edgeChunk(requestId, index + 1).catch(() => {})
      clearAudio()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      activeEngineRef.current = 'edge'
      audio.onplay = () => {if (requestId === requestRef.current){setState('speaking');setStatusText('Playing')}}
      audio.onended = () => {if (requestId === requestRef.current){clearAudio();indexRef.current=index+1;playEdgeChunk(requestId,index+1)}}
      audio.onerror = () => fallbackToDevice(requestId)
      await audio.play()
    } catch (error) {
      if (error?.name !== 'AbortError') fallbackToDevice(requestId)
    }
  }

  async function playEdge(value) {
    if (!value) return
    if (deviceSupported) window.speechSynthesis.cancel()
    clearAudio(); cancelFetches()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token || ''
    const requestId = Date.now() + Math.random()
    requestRef.current = requestId
    if (!token) return fallbackToDevice(requestId, value)
    chunksRef.current = splitText(value)
    if (!chunksRef.current.length) return
    indexRef.current = 0
    tokenRef.current = token
    setState('loading'); setStatusText('Preparing natural voice…')
    playEdgeChunk(requestId, 0)
  }

  function playDeviceChunk(requestId, index) {
    if (!deviceSupported || requestId !== requestRef.current) return
    if (index >= chunksRef.current.length) {
      setState('idle'); setStatusText(''); activeEngineRef.current=null; utteranceRef.current=null; return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(chunksRef.current[index])
    utterance.lang = 'en-GB'
    utterance.rate = Number(rate)
    const chosen = deviceVoices.find(v => v.name === deviceVoiceName) || bestDeviceVoice(deviceVoices)
    if (chosen) utterance.voice = chosen
    utteranceRef.current = utterance
    activeEngineRef.current = 'device'
    utterance.onstart = () => {if(requestId===requestRef.current){setState('speaking');setStatusText('Playing')}}
    utterance.onend = () => {if(requestId===requestRef.current){indexRef.current=index+1;playDeviceChunk(requestId,index+1)}}
    utterance.onerror = event => {
      if (requestId !== requestRef.current || event?.error === 'canceled' || event?.error === 'interrupted') return
      setState('idle'); setStatusText('Read aloud stopped.'); activeEngineRef.current=null
    }
    window.speechSynthesis.speak(utterance)
  }

  function playDevice(value, preserveStatus = false) {
    if (!deviceSupported || !value) return
    clearAudio(); cancelFetches(); window.speechSynthesis.cancel()
    const requestId = Date.now() + Math.random()
    requestRef.current = requestId
    chunksRef.current = splitText(value, 220)
    indexRef.current = 0
    if (!preserveStatus) setStatusText('')
    playDeviceChunk(requestId, 0)
  }

  function fallbackToDevice(requestId, fallbackText = '') {
    if (requestId !== requestRef.current) return
    clearAudio(); cancelFetches()
    const value = fallbackText || chunksRef.current.slice(indexRef.current).join(' ') || content()
    setStatusText('Natural online voice unavailable. Using this device voice.')
    playDevice(value, true)
  }

  function play() {
    if (state === 'paused') {
      if (activeEngineRef.current === 'edge' && audioRef.current) audioRef.current.play().then(()=>setState('speaking')).catch(()=>{})
      else if (activeEngineRef.current === 'device' && deviceSupported) {window.speechSynthesis.resume();setState('speaking')}
      return
    }
    const value = content()
    if (!value) return
    if (engine === 'edge') playEdge(value)
    else playDevice(value)
  }

  function pause() {
    if (state !== 'speaking') return
    if (activeEngineRef.current === 'edge' && audioRef.current) {audioRef.current.pause();setState('paused');setStatusText('Paused');return}
    if (activeEngineRef.current === 'device' && deviceSupported && window.speechSynthesis.speaking) {window.speechSynthesis.pause();setState('paused');setStatusText('Paused')}
  }

  function stop(updateState = true) {
    requestRef.current += 1
    clearAudio(); cancelFetches()
    if (deviceSupported) window.speechSynthesis.cancel()
    utteranceRef.current = null
    chunksRef.current = []
    indexRef.current = 0
    tokenRef.current = ''
    activeEngineRef.current = null
    if (updateState) {setState('idle');setStatusText('')}
  }

  const busy = state === 'loading'
  const playLabel = state === 'paused' ? 'Continue' : busy ? 'Loading…' : label
  const speedControl = <label className="speech-speed">Speed
    <select value={rate} onChange={e => rememberRate(e.target.value)} aria-label="Playback speed">
      <option value="0.8">0.8×</option><option value="0.9">0.9×</option><option value="0.95">0.95×</option><option value="1">1×</option><option value="1.12">1.12×</option><option value="1.25">1.25×</option>
    </select>
  </label>

  if (!deviceSupported && engine === 'device') return <div className="speech-unsupported">Read aloud is not supported on this device.</div>

  if (compact) return <div className="speech-controls speech-controls-compact" aria-label="Read aloud controls">
    <button type="button" onClick={play} disabled={busy} title="Listen to this section">{state === 'paused' ? <CirclePlay/> : engine === 'edge' ? <Sparkles/> : <Volume2/>}<small>{playLabel}</small></button>
    <button type="button" onClick={pause} disabled={state !== 'speaking'} title="Pause"><CirclePause/><small>Pause</small></button>
    <button type="button" onClick={()=>stop()} disabled={state === 'idle'} title="Stop"><Square/><small>Stop</small></button>
    {speedControl}
  </div>

  return <div className="speech-controls speech-controls-full" aria-label="Read aloud controls">
    <div className="speech-buttons">
      <button type="button" onClick={play} disabled={busy}>{state === 'paused' ? <CirclePlay size={18}/> : engine === 'edge' ? <Sparkles size={18}/> : <Volume2 size={18}/>} {playLabel}</button>
      <button type="button" onClick={pause} disabled={state !== 'speaking'}><CirclePause size={18}/> Pause</button>
      <button type="button" onClick={()=>stop()} disabled={state === 'idle'}><Square size={16}/> Stop</button>
    </div>
    {speedControl}
    <label>Voice type
      <select value={engine} onChange={e => rememberEngine(e.target.value)}>
        <option value="edge">Natural online voice</option>
        <option value="device">Chrome / device voice</option>
      </select>
    </label>
    {engine === 'edge' ? <label>Voice
      <select value={edgeVoice} onChange={e => rememberEdgeVoice(e.target.value)}>{EDGE_VOICES.map(v => <option key={v.id} value={v.id}>{v.label} · {v.detail}</option>)}</select>
    </label> : <label>Voice
      <select value={deviceVoiceName} onChange={e => {stop(false);setState('idle');setDeviceVoiceName(e.target.value)}}>
        {(englishDeviceVoices.length ? englishDeviceVoices : deviceVoices).map(v => <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>)}
      </select>
    </label>}
    <div className="speech-status" aria-live="polite">
      <span className={engine === 'edge' ? 'speech-badge natural' : 'speech-badge'}>{engine === 'edge' ? 'Natural' : 'Device'}</span>
      <span>{statusText || 'Reads only the current section. Changing section, topic or layer stops the previous reading.'}</span>
    </div>
  </div>
}

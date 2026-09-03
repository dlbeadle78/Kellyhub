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
  const clean = String(value || '').replace(/\s+/g, ' ').trim()
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

export default function SpeechControls({ text = '', getText, compact = false, label = 'Read aloud' }) {
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

  useEffect(() => {
    if (!deviceSupported) return
    const load = () => {
      const available = window.speechSynthesis.getVoices()
      setDeviceVoices(available)
      setDeviceVoiceName(current => {
        if (current && available.some(v => v.name === current)) return current
        const preferred = available.find(v => /^en-GB/i.test(v.lang)) || available.find(v => /^en/i.test(v.lang)) || available[0]
        return preferred?.name || ''
      })
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load)
  }, [deviceSupported])

  useEffect(() => () => stop(false), [])

  const englishDeviceVoices = useMemo(() => deviceVoices.filter(v => /^en/i.test(v.lang)), [deviceVoices])

  function content() {
    return String(typeof getText === 'function' ? getText() : text || '').replace(/\s+/g, ' ').trim()
  }

  function rememberRate(value) {
    const next = Number(value)
    setRate(next)
    try { localStorage.setItem('kellyn-speech-rate', String(next)) } catch (_) {}
  }

  function rememberEngine(value) {
    stop(false)
    setEngine(value)
    try { localStorage.setItem('kellyn-speech-engine-v3', value) } catch (_) {}
    setStatusText('')
  }

  function rememberEdgeVoice(value) {
    stop(false)
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRef.current}`,
      },
      body: JSON.stringify({
        text: chunksRef.current[index],
        voice: edgeVoice,
        speed: rate,
      }),
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
      setState('idle')
      setStatusText('')
      activeEngineRef.current = null
      return
    }

    try {
      setState('loading')
      setStatusText(index === 0 ? 'Connecting to Microsoft Edge voice…' : 'Preparing the next section…')
      const blob = await edgeChunk(requestId, index)
      if (requestId !== requestRef.current || !blob) return

      edgeChunk(requestId, index + 1).catch(() => {})
      clearAudio()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      activeEngineRef.current = 'edge'
      audio.onplay = () => {
        if (requestId !== requestRef.current) return
        setState('speaking')
        setStatusText('Microsoft Edge neural voice')
      }
      audio.onended = () => {
        if (requestId !== requestRef.current) return
        clearAudio()
        indexRef.current = index + 1
        playEdgeChunk(requestId, index + 1)
      }
      audio.onerror = () => fallbackToDevice(requestId)
      await audio.play()
    } catch (error) {
      if (error?.name === 'AbortError') return
      fallbackToDevice(requestId)
    }
  }

  async function playEdge(value) {
    if (!value) return
    if (deviceSupported) window.speechSynthesis.cancel()
    clearAudio()
    cancelFetches()

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token || ''
    if (!token) return fallbackToDevice(requestRef.current, value)

    const chunks = splitText(value)
    if (!chunks.length) return
    chunksRef.current = chunks
    indexRef.current = 0
    tokenRef.current = token
    const requestId = Date.now() + Math.random()
    requestRef.current = requestId
    setState('loading')
    setStatusText('Connecting to Microsoft Edge voice…')
    playEdgeChunk(requestId, 0)
  }

  function fallbackToDevice(requestId, fallbackText = '') {
    if (requestId !== requestRef.current && requestRef.current !== 0) return
    clearAudio()
    cancelFetches()
    setState('idle')
    setStatusText('Microsoft Edge voice is temporarily unavailable. Using the device voice instead.')
    playDevice(fallbackText || content(), true)
  }

  function playDevice(value, preserveStatus = false) {
    if (!deviceSupported || !value) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = 'en-GB'
    utterance.rate = Number(rate)
    const chosen = deviceVoices.find(v => v.name === deviceVoiceName)
    if (chosen) utterance.voice = chosen
    activeEngineRef.current = 'device'
    utterance.onstart = () => { setState('speaking'); if (!preserveStatus) setStatusText('Device voice') }
    utterance.onend = () => { setState('idle'); setStatusText(''); activeEngineRef.current = null }
    utterance.onerror = () => { setState('idle'); setStatusText(''); activeEngineRef.current = null }
    window.speechSynthesis.speak(utterance)
  }

  function play() {
    if (state === 'paused') {
      if (activeEngineRef.current === 'edge' && audioRef.current) {
        audioRef.current.play().then(() => setState('speaking')).catch(() => {})
      } else if (activeEngineRef.current === 'device' && deviceSupported) {
        window.speechSynthesis.resume()
        setState('speaking')
      }
      return
    }
    const value = content()
    if (!value) return
    if (engine === 'edge') playEdge(value)
    else playDevice(value)
  }

  function pause() {
    if (state !== 'speaking') return
    if (activeEngineRef.current === 'edge' && audioRef.current) {
      audioRef.current.pause()
      setState('paused')
      setStatusText('Paused')
      return
    }
    if (activeEngineRef.current === 'device' && deviceSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setState('paused')
      setStatusText('Paused')
    }
  }

  function stop(updateState = true) {
    requestRef.current += 1
    clearAudio()
    cancelFetches()
    if (deviceSupported) window.speechSynthesis.cancel()
    chunksRef.current = []
    indexRef.current = 0
    tokenRef.current = ''
    activeEngineRef.current = null
    if (updateState) {
      setState('idle')
      setStatusText('')
    }
  }

  const busy = state === 'loading'
  const playLabel = state === 'paused' ? 'Continue' : busy ? 'Loading…' : label

  if (!deviceSupported && engine === 'device') return <div className="speech-unsupported">Read aloud is not supported on this device.</div>

  if (compact) return <div className="speech-controls speech-controls-compact" aria-label="Read aloud controls">
    <button type="button" onClick={play} disabled={busy} title={engine === 'edge' ? 'Read with Microsoft Edge neural voice' : label}>{state === 'paused' ? <CirclePlay/> : engine === 'edge' ? <Sparkles/> : <Volume2/>}<small>{playLabel}</small></button>
    <button type="button" onClick={pause} disabled={state !== 'speaking'} title="Pause reading"><CirclePause/><small>Pause</small></button>
    <button type="button" onClick={()=>stop()} disabled={state === 'idle'} title="Stop reading"><Square/><small>Stop</small></button>
  </div>

  return <div className="speech-controls speech-controls-full" aria-label="Read aloud controls">
    <div className="speech-buttons">
      <button type="button" onClick={play} disabled={busy}>{state === 'paused' ? <CirclePlay size={18}/> : engine === 'edge' ? <Sparkles size={18}/> : <Volume2 size={18}/>} {playLabel}</button>
      <button type="button" onClick={pause} disabled={state !== 'speaking'}><CirclePause size={18}/> Pause</button>
      <button type="button" onClick={()=>stop()} disabled={state === 'idle'}><Square size={16}/> Stop</button>
    </div>
    <label>Voice type
      <select value={engine} onChange={e => rememberEngine(e.target.value)}>
        <option value="edge">Microsoft Edge neural</option>
        <option value="device">Device voice</option>
      </select>
    </label>
    <label>Speed
      <select value={rate} onChange={e => rememberRate(e.target.value)}>
        <option value="0.75">Slow</option><option value="0.9">Comfortable</option><option value="0.95">Natural</option><option value="1">Normal</option><option value="1.12">Faster</option>
      </select>
    </label>
    {engine === 'edge' ? <label>Voice
      <select value={edgeVoice} onChange={e => rememberEdgeVoice(e.target.value)}>
        {EDGE_VOICES.map(v => <option key={v.id} value={v.id}>{v.label} · {v.detail}</option>)}
      </select>
    </label> : <label>Voice
      <select value={deviceVoiceName} onChange={e => setDeviceVoiceName(e.target.value)}>
        {(englishDeviceVoices.length ? englishDeviceVoices : deviceVoices).map(v => <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>)}
      </select>
    </label>}
    <div className="speech-status" aria-live="polite">
      <span className={engine === 'edge' ? 'speech-badge natural' : 'speech-badge'}>{engine === 'edge' ? 'Edge Neural' : 'Device'}</span>
      <span>{statusText || (engine === 'edge' ? 'Fast online natural speech with no voice-model download. Text is sent to Microsoft only to generate the spoken audio.' : 'Uses the voice already available on this device.')}</span>
    </div>
  </div>
}

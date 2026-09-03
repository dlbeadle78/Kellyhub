import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CirclePause, CirclePlay, Sparkles, Square, Volume2 } from 'lucide-react'
import './speech.css'

const NATURAL_VOICES = [
  { id: 'bf_emma', label: 'Emma', detail: 'British female' },
  { id: 'bf_isabella', label: 'Isabella', detail: 'British female' },
  { id: 'bm_george', label: 'George', detail: 'British male' },
  { id: 'af_heart', label: 'Heart', detail: 'Natural female' },
]

let sharedWorker = null
function getNaturalWorker() {
  if (!sharedWorker && typeof Worker !== 'undefined') {
    sharedWorker = new Worker(new URL('./naturalSpeechWorker.js', import.meta.url), { type: 'module' })
  }
  return sharedWorker
}

function saved(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch (_) { return fallback }
}

export default function SpeechControls({ text = '', getText, compact = false, label = 'Read aloud' }) {
  const deviceSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [deviceVoices, setDeviceVoices] = useState([])
  const [deviceVoiceName, setDeviceVoiceName] = useState('')
  const [engine, setEngine] = useState(() => saved('kellyn-speech-engine', 'natural'))
  const [naturalVoice, setNaturalVoice] = useState(() => saved('kellyn-natural-voice', 'bf_emma'))
  const [rate, setRate] = useState(() => Number(saved('kellyn-speech-rate', '0.95')))
  const [state, setState] = useState('idle')
  const [statusText, setStatusText] = useState('')
  const requestRef = useRef(null)
  const audioRef = useRef(null)
  const queueRef = useRef([])
  const generationDoneRef = useRef(false)
  const urlsRef = useRef(new Set())

  useEffect(() => {
    if (!deviceSupported) return
    const load = () => {
      const available = window.speechSynthesis.getVoices()
      setDeviceVoices(available)
      if (!deviceVoiceName && available.length) {
        const preferred = available.find(v => /^en-GB/i.test(v.lang)) || available.find(v => /^en/i.test(v.lang)) || available[0]
        setDeviceVoiceName(preferred?.name || '')
      }
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load)
  }, [deviceSupported, deviceVoiceName])

  useEffect(() => {
    const worker = getNaturalWorker()
    if (!worker) return
    const onMessage = (event) => {
      const data = event.data || {}
      if (!requestRef.current || data.requestId !== requestRef.current) return
      if (data.status === 'loading') {
        setState('loading')
        setStatusText(data.device === 'webgpu' ? 'Loading natural voice…' : 'Loading natural voice… first use may take a little longer on this device.')
      }
      if (data.status === 'ready') {
        setStatusText('Natural voice ready')
      }
      if (data.status === 'audio' && data.blob) {
        const url = URL.createObjectURL(data.blob)
        urlsRef.current.add(url)
        queueRef.current.push(url)
        if (!audioRef.current) playNextNatural()
      }
      if (data.status === 'done') {
        generationDoneRef.current = true
        if (!audioRef.current && queueRef.current.length === 0) {
          setState('idle')
          setStatusText('')
        }
      }
      if (data.status === 'error') {
        setStatusText('Natural voice unavailable. Using the device voice instead.')
        setEngine('device')
        try { localStorage.setItem('kellyn-speech-engine', 'device') } catch (_) {}
        setState('idle')
        playDevice(content())
      }
    }
    worker.addEventListener('message', onMessage)
    return () => worker.removeEventListener('message', onMessage)
  }, [deviceVoices, deviceVoiceName, rate])

  useEffect(() => () => stop(false), [])

  const englishDeviceVoices = useMemo(() => deviceVoices.filter(v => /^en/i.test(v.lang)), [deviceVoices])

  function content() {
    return String(typeof getText === 'function' ? getText() : text || '').replace(/\s+/g, ' ').trim()
  }

  function rememberEngine(value) {
    setEngine(value)
    try { localStorage.setItem('kellyn-speech-engine', value) } catch (_) {}
    stop(false)
  }

  function rememberNaturalVoice(value) {
    setNaturalVoice(value)
    try { localStorage.setItem('kellyn-natural-voice', value) } catch (_) {}
  }

  function rememberRate(value) {
    const next = Number(value)
    setRate(next)
    try { localStorage.setItem('kellyn-speech-rate', String(next)) } catch (_) {}
  }

  function clearNaturalAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    queueRef.current.length = 0
    for (const url of urlsRef.current) URL.revokeObjectURL(url)
    urlsRef.current.clear()
    generationDoneRef.current = false
  }

  function playNextNatural() {
    if (audioRef.current) return
    const url = queueRef.current.shift()
    if (!url) {
      if (generationDoneRef.current) {
        setState('idle')
        setStatusText('')
      } else {
        setState('loading')
      }
      return
    }
    const audio = new Audio(url)
    audioRef.current = audio
    audio.onplay = () => { setState('speaking'); setStatusText('Natural voice') }
    audio.onended = () => {
      URL.revokeObjectURL(url)
      urlsRef.current.delete(url)
      audioRef.current = null
      playNextNatural()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      urlsRef.current.delete(url)
      audioRef.current = null
      playNextNatural()
    }
    audio.play().catch(() => {
      setState('paused')
      setStatusText('Tap Continue to play the natural voice.')
    })
  }

  function playNatural(value) {
    const worker = getNaturalWorker()
    if (!worker) {
      setEngine('device')
      return playDevice(value)
    }
    clearNaturalAudio()
    if (deviceSupported) window.speechSynthesis.cancel()
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    requestRef.current = requestId
    generationDoneRef.current = false
    setState('loading')
    setStatusText('Preparing natural voice…')
    worker.postMessage({ type: 'generate', requestId, text: value, voice: naturalVoice, speed: rate })
  }

  function playDevice(value) {
    if (!deviceSupported || !value) return
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setState('speaking')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = 'en-GB'
    utterance.rate = Number(rate)
    const chosen = deviceVoices.find(v => v.name === deviceVoiceName)
    if (chosen) utterance.voice = chosen
    utterance.onstart = () => { setState('speaking'); setStatusText('Device voice') }
    utterance.onend = () => { setState('idle'); setStatusText('') }
    utterance.onerror = () => { setState('idle'); setStatusText('') }
    window.speechSynthesis.speak(utterance)
  }

  function play() {
    if (state === 'paused') {
      if (engine === 'natural' && audioRef.current) {
        audioRef.current.play().then(() => setState('speaking')).catch(() => {})
      } else if (engine === 'device' && deviceSupported) {
        window.speechSynthesis.resume()
        setState('speaking')
      }
      return
    }
    const value = content()
    if (!value) return
    if (engine === 'natural') playNatural(value)
    else playDevice(value)
  }

  function pause() {
    if (state !== 'speaking') return
    if (engine === 'natural' && audioRef.current) {
      audioRef.current.pause()
      setState('paused')
      setStatusText('Paused')
      return
    }
    if (engine === 'device' && deviceSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setState('paused')
      setStatusText('Paused')
    }
  }

  function stop(updateState = true) {
    if (requestRef.current) getNaturalWorker()?.postMessage({ type: 'cancel', requestId: requestRef.current })
    requestRef.current = null
    clearNaturalAudio()
    if (deviceSupported) window.speechSynthesis.cancel()
    if (updateState) {
      setState('idle')
      setStatusText('')
    }
  }

  const busy = state === 'loading'
  const playLabel = state === 'paused' ? 'Continue' : busy ? 'Loading…' : label

  if (compact) return <div className="speech-controls speech-controls-compact" aria-label="Read aloud controls">
    <button type="button" onClick={play} disabled={busy} title={engine === 'natural' ? 'Read with natural voice' : label}>{state === 'paused' ? <CirclePlay/> : engine === 'natural' ? <Sparkles/> : <Volume2/>}<small>{playLabel}</small></button>
    <button type="button" onClick={pause} disabled={state !== 'speaking'} title="Pause reading"><CirclePause/><small>Pause</small></button>
    <button type="button" onClick={()=>stop()} disabled={state === 'idle'} title="Stop reading"><Square/><small>Stop</small></button>
  </div>

  return <div className="speech-controls speech-controls-full" aria-label="Read aloud controls">
    <div className="speech-buttons">
      <button type="button" onClick={play} disabled={busy}>{state === 'paused' ? <CirclePlay size={18}/> : engine === 'natural' ? <Sparkles size={18}/> : <Volume2 size={18}/>} {playLabel}</button>
      <button type="button" onClick={pause} disabled={state !== 'speaking'}><CirclePause size={18}/> Pause</button>
      <button type="button" onClick={()=>stop()} disabled={state === 'idle'}><Square size={16}/> Stop</button>
    </div>
    <label>Voice type
      <select value={engine} onChange={e => rememberEngine(e.target.value)}>
        <option value="natural">Natural voice</option>
        <option value="device">Device voice</option>
      </select>
    </label>
    <label>Speed
      <select value={rate} onChange={e => rememberRate(e.target.value)}>
        <option value="0.75">Slow</option><option value="0.9">Comfortable</option><option value="0.95">Natural</option><option value="1">Normal</option><option value="1.12">Faster</option>
      </select>
    </label>
    {engine === 'natural' ? <label>Voice
      <select value={naturalVoice} onChange={e => rememberNaturalVoice(e.target.value)}>
        {NATURAL_VOICES.map(v => <option key={v.id} value={v.id}>{v.label} · {v.detail}</option>)}
      </select>
    </label> : <label>Voice
      <select value={deviceVoiceName} onChange={e => setDeviceVoiceName(e.target.value)}>
        {(englishDeviceVoices.length ? englishDeviceVoices : deviceVoices).map(v => <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>)}
      </select>
    </label>}
    <div className="speech-status" aria-live="polite">
      <span className={engine === 'natural' ? 'speech-badge natural' : 'speech-badge'}>{engine === 'natural' ? 'Natural' : 'Device'}</span>
      <span>{statusText || (engine === 'natural' ? 'First use downloads the free voice model to this device.' : 'Uses the voices already available on this device.')}</span>
    </div>
  </div>
}

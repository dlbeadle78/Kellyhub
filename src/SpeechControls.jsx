import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CirclePause, CirclePlay, Sparkles, Square, Volume2 } from 'lucide-react'
import './speech.css'

const PIPER_VOICES = [
  { id: 'en_GB-alba-medium', label: 'Alba', detail: 'British female' },
  { id: 'en_GB-alan-medium', label: 'Alan', detail: 'British male' },
]

let piperModulePromise = null
const piperDownloadPromises = new Map()

function saved(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch (_) { return fallback }
}

function loadPiper() {
  if (!piperModulePromise) piperModulePromise = import('@mintplex-labs/piper-tts-web')
  return piperModulePromise
}

async function ensurePiperVoice(voiceId, onProgress) {
  const piper = await loadPiper()
  let stored = []
  try { stored = await piper.stored() } catch (_) {}
  if (stored.includes(voiceId)) return piper

  if (!piperDownloadPromises.has(voiceId)) {
    const promise = piper.download(voiceId, progress => {
      const total = Number(progress?.total) || 0
      const loaded = Number(progress?.loaded) || 0
      if (total > 0) onProgress?.(Math.max(0, Math.min(100, Math.round((loaded / total) * 100))))
    }).finally(() => piperDownloadPromises.delete(voiceId))
    piperDownloadPromises.set(voiceId, promise)
  }
  await piperDownloadPromises.get(voiceId)
  return piper
}

function splitText(value, maxChars = 180) {
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
  const [engine, setEngine] = useState(() => saved('kellyn-speech-engine-v2', 'natural'))
  const [naturalVoice, setNaturalVoice] = useState(() => saved('kellyn-piper-voice', 'en_GB-alba-medium'))
  const [rate, setRate] = useState(() => Number(saved('kellyn-speech-rate', '0.95')))
  const [state, setState] = useState('idle')
  const [statusText, setStatusText] = useState('')
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null)
  const requestRef = useRef(0)
  const naturalChunksRef = useRef([])
  const naturalIndexRef = useRef(0)

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

  useEffect(() => {
    if (engine !== 'natural' || typeof navigator === 'undefined') return
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return
    const timer = window.setTimeout(() => {
      ensurePiperVoice(naturalVoice).catch(() => {})
    }, 900)
    return () => window.clearTimeout(timer)
  }, [engine, naturalVoice])

  useEffect(() => () => stop(false), [])

  const englishDeviceVoices = useMemo(() => deviceVoices.filter(v => /^en/i.test(v.lang)), [deviceVoices])

  function content() {
    return String(typeof getText === 'function' ? getText() : text || '').replace(/\s+/g, ' ').trim()
  }

  function rememberRate(value) {
    const next = Number(value)
    setRate(next)
    try { localStorage.setItem('kellyn-speech-rate', String(next)) } catch (_) {}
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  function rememberEngine(value) {
    stop(false)
    setEngine(value)
    try { localStorage.setItem('kellyn-speech-engine-v2', value) } catch (_) {}
    setStatusText('')
  }

  function rememberNaturalVoice(value) {
    stop(false)
    setNaturalVoice(value)
    try { localStorage.setItem('kellyn-piper-voice', value) } catch (_) {}
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

  async function generateNaturalChunk(requestId) {
    if (requestId !== requestRef.current) return
    const chunk = naturalChunksRef.current[naturalIndexRef.current]
    if (!chunk) {
      setState('idle')
      setStatusText('')
      return
    }

    try {
      setState('loading')
      setStatusText('Preparing natural voice…')
      const piper = await ensurePiperVoice(naturalVoice, percent => {
        if (requestId === requestRef.current) setStatusText(`Downloading natural voice… ${percent}%`)
      })
      if (requestId !== requestRef.current) return

      setStatusText('Generating speech…')
      const wav = await piper.predict({ text: chunk, voiceId: naturalVoice })
      if (requestId !== requestRef.current) return

      clearAudio()
      const url = URL.createObjectURL(wav)
      objectUrlRef.current = url
      const audio = new Audio(url)
      audio.playbackRate = Number(rate) || 1
      audioRef.current = audio
      audio.onplay = () => {
        if (requestId !== requestRef.current) return
        setState('speaking')
        setStatusText('Natural voice')
      }
      audio.onended = () => {
        if (requestId !== requestRef.current) return
        clearAudio()
        naturalIndexRef.current += 1
        generateNaturalChunk(requestId)
      }
      audio.onerror = () => fallbackToDevice(requestId)
      await audio.play()
    } catch (_) {
      fallbackToDevice(requestId)
    }
  }

  function fallbackToDevice(requestId) {
    if (requestId !== requestRef.current) return
    const value = content()
    clearAudio()
    setEngine('device')
    try { localStorage.setItem('kellyn-speech-engine-v2', 'device') } catch (_) {}
    setStatusText('Natural voice could not play correctly. Using device voice instead.')
    setState('idle')
    playDevice(value, true)
  }

  function playNatural(value) {
    if (!value) return
    if (deviceSupported) window.speechSynthesis.cancel()
    clearAudio()
    const chunks = splitText(value)
    if (!chunks.length) return
    naturalChunksRef.current = chunks
    naturalIndexRef.current = 0
    const requestId = Date.now() + Math.random()
    requestRef.current = requestId
    generateNaturalChunk(requestId)
  }

  function playDevice(value, preserveStatus = false) {
    if (!deviceSupported || !value) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = 'en-GB'
    utterance.rate = Number(rate)
    const chosen = deviceVoices.find(v => v.name === deviceVoiceName)
    if (chosen) utterance.voice = chosen
    utterance.onstart = () => { setState('speaking'); if (!preserveStatus) setStatusText('Device voice') }
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
    requestRef.current += 1
    clearAudio()
    if (deviceSupported) window.speechSynthesis.cancel()
    naturalChunksRef.current = []
    naturalIndexRef.current = 0
    if (updateState) {
      setState('idle')
      setStatusText('')
    }
  }

  const busy = state === 'loading'
  const playLabel = state === 'paused' ? 'Continue' : busy ? 'Loading…' : label

  if (!deviceSupported && engine === 'device') return <div className="speech-unsupported">Read aloud is not supported on this device.</div>

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
        {PIPER_VOICES.map(v => <option key={v.id} value={v.id}>{v.label} · {v.detail}</option>)}
      </select>
    </label> : <label>Voice
      <select value={deviceVoiceName} onChange={e => setDeviceVoiceName(e.target.value)}>
        {(englishDeviceVoices.length ? englishDeviceVoices : deviceVoices).map(v => <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>)}
      </select>
    </label>}
    <div className="speech-status" aria-live="polite">
      <span className={engine === 'natural' ? 'speech-badge natural' : 'speech-badge'}>{engine === 'natural' ? 'Natural' : 'Device'}</span>
      <span>{statusText || (engine === 'natural' ? 'Piper natural voice. The voice downloads once, then is stored on this device for future use.' : 'Uses the reliable voice already available on this device.')}</span>
    </div>
  </div>
}

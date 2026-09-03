import React, { useEffect, useMemo, useState } from 'react'
import { CirclePause, CirclePlay, Square, Volume2 } from 'lucide-react'
import './speech.css'

function saved(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch (_) { return fallback }
}

export default function SpeechControls({ text = '', getText, compact = false, label = 'Read aloud' }) {
  const deviceSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [deviceVoices, setDeviceVoices] = useState([])
  const [deviceVoiceName, setDeviceVoiceName] = useState('')
  const [rate, setRate] = useState(() => Number(saved('kellyn-speech-rate', '0.95')))
  const [state, setState] = useState('idle')
  const [statusText, setStatusText] = useState('')

  useEffect(() => {
    try { localStorage.setItem('kellyn-speech-engine', 'device') } catch (_) {}
  }, [])

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

  useEffect(() => () => {
    if (deviceSupported) window.speechSynthesis.cancel()
  }, [deviceSupported])

  const englishDeviceVoices = useMemo(() => deviceVoices.filter(v => /^en/i.test(v.lang)), [deviceVoices])

  function content() {
    return String(typeof getText === 'function' ? getText() : text || '').replace(/\s+/g, ' ').trim()
  }

  function rememberRate(value) {
    const next = Number(value)
    setRate(next)
    try { localStorage.setItem('kellyn-speech-rate', String(next)) } catch (_) {}
  }

  function play() {
    if (!deviceSupported) return
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('speaking')
      setStatusText('Device voice')
      return
    }
    const value = content()
    if (!value) return
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

  function pause() {
    if (!deviceSupported || state !== 'speaking') return
    window.speechSynthesis.pause()
    setState('paused')
    setStatusText('Paused')
  }

  function stop() {
    if (deviceSupported) window.speechSynthesis.cancel()
    setState('idle')
    setStatusText('')
  }

  const playLabel = state === 'paused' ? 'Continue' : label

  if (!deviceSupported) return <div className="speech-unsupported">Read aloud is not supported on this device.</div>

  if (compact) return <div className="speech-controls speech-controls-compact" aria-label="Read aloud controls">
    <button type="button" onClick={play} title={label}>{state === 'paused' ? <CirclePlay/> : <Volume2/>}<small>{playLabel}</small></button>
    <button type="button" onClick={pause} disabled={state !== 'speaking'} title="Pause reading"><CirclePause/><small>Pause</small></button>
    <button type="button" onClick={stop} disabled={state === 'idle'} title="Stop reading"><Square/><small>Stop</small></button>
  </div>

  return <div className="speech-controls speech-controls-full" aria-label="Read aloud controls">
    <div className="speech-buttons">
      <button type="button" onClick={play}>{state === 'paused' ? <CirclePlay size={18}/> : <Volume2 size={18}/>} {playLabel}</button>
      <button type="button" onClick={pause} disabled={state !== 'speaking'}><CirclePause size={18}/> Pause</button>
      <button type="button" onClick={stop} disabled={state === 'idle'}><Square size={16}/> Stop</button>
    </div>
    <label>Voice type
      <select value="device" disabled>
        <option value="device">Device voice</option>
      </select>
    </label>
    <label>Speed
      <select value={rate} onChange={e => rememberRate(e.target.value)}>
        <option value="0.75">Slow</option><option value="0.9">Comfortable</option><option value="0.95">Natural</option><option value="1">Normal</option><option value="1.12">Faster</option>
      </select>
    </label>
    <label>Voice
      <select value={deviceVoiceName} onChange={e => setDeviceVoiceName(e.target.value)}>
        {(englishDeviceVoices.length ? englishDeviceVoices : deviceVoices).map(v => <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>)}
      </select>
    </label>
    <div className="speech-status" aria-live="polite">
      <span className="speech-badge">Device</span>
      <span>{statusText || 'Using the reliable voice already available on this device. Natural voice is temporarily disabled while it is being fixed.'}</span>
    </div>
  </div>
}

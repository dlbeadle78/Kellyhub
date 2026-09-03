import React, { useEffect, useMemo, useState } from 'react'
import { CirclePause, CirclePlay, Square, Volume2 } from 'lucide-react'
import './speech.css'

export default function SpeechControls({ text = '', getText, compact = false, label = 'Read aloud' }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [voices, setVoices] = useState([])
  const [voiceName, setVoiceName] = useState('')
  const [rate, setRate] = useState(0.9)
  const [state, setState] = useState('idle')

  useEffect(() => {
    if (!supported) return
    const load = () => {
      const available = window.speechSynthesis.getVoices()
      setVoices(available)
      if (!voiceName && available.length) {
        const preferred = available.find(v => /^en-GB/i.test(v.lang)) || available.find(v => /^en/i.test(v.lang)) || available[0]
        setVoiceName(preferred?.name || '')
      }
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load)
  }, [supported, voiceName])

  const englishVoices = useMemo(() => voices.filter(v => /^en/i.test(v.lang)), [voices])

  function content() {
    return String(typeof getText === 'function' ? getText() : text || '').trim()
  }

  function play() {
    if (!supported) return
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setState('speaking')
      return
    }
    const value = content()
    if (!value) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = 'en-GB'
    utterance.rate = Number(rate)
    const chosen = voices.find(v => v.name === voiceName)
    if (chosen) utterance.voice = chosen
    utterance.onstart = () => setState('speaking')
    utterance.onend = () => setState('idle')
    utterance.onerror = () => setState('idle')
    window.speechSynthesis.speak(utterance)
  }

  function pause() {
    if (!supported || !window.speechSynthesis.speaking || window.speechSynthesis.paused) return
    window.speechSynthesis.pause()
    setState('paused')
  }

  function stop() {
    if (!supported) return
    window.speechSynthesis.cancel()
    setState('idle')
  }

  if (!supported) return <span className="speech-unsupported">Read aloud is not supported by this browser.</span>

  if (compact) return <div className="speech-controls speech-controls-compact" aria-label="Read aloud controls">
    <button type="button" onClick={play} title={state === 'paused' ? 'Continue reading' : label}>{state === 'paused' ? <CirclePlay/> : <Volume2/>}<small>{state === 'paused' ? 'Continue' : label}</small></button>
    <button type="button" onClick={pause} disabled={state !== 'speaking'} title="Pause reading"><CirclePause/><small>Pause</small></button>
    <button type="button" onClick={stop} disabled={state === 'idle'} title="Stop reading"><Square/><small>Stop</small></button>
  </div>

  return <div className="speech-controls speech-controls-full" aria-label="Read aloud controls">
    <div className="speech-buttons">
      <button type="button" onClick={play}>{state === 'paused' ? <CirclePlay size={18}/> : <Volume2 size={18}/>} {state === 'paused' ? 'Continue' : label}</button>
      <button type="button" onClick={pause} disabled={state !== 'speaking'}><CirclePause size={18}/> Pause</button>
      <button type="button" onClick={stop} disabled={state === 'idle'}><Square size={16}/> Stop</button>
    </div>
    <label>Speed
      <select value={rate} onChange={e => setRate(Number(e.target.value))}>
        <option value="0.7">Slow</option><option value="0.9">Comfortable</option><option value="1">Normal</option><option value="1.15">Faster</option><option value="1.3">Fast</option>
      </select>
    </label>
    <label>Voice
      <select value={voiceName} onChange={e => setVoiceName(e.target.value)}>
        {(englishVoices.length ? englishVoices : voices).map(v => <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>)}
      </select>
    </label>
  </div>
}

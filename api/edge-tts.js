import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

const ALLOWED_VOICES = new Set([
  'en-GB-SoniaNeural',
  'en-GB-LibbyNeural',
  'en-GB-RyanNeural',
])

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://obwbalpxttdfbeushvaw.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_LU8Gi0RscZ-m63Bm1pAHNw_8wQ-ONHq'
const authCache = globalThis.__kellynTtsAuthCache || new Map()
globalThis.__kellynTtsAuthCache = authCache

function cleanText(value) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\s+/g, ' ')
    .trim()
}

function rateFor(speed) {
  const value = Math.max(0.7, Math.min(1.3, Number(speed) || 1))
  const percent = Math.round((value - 1) * 100)
  return `${percent >= 0 ? '+' : ''}${percent}%`
}

async function authorised(req) {
  const header = String(req.headers.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return false

  const cachedUntil = authCache.get(token)
  if (cachedUntil && cachedUntil > Date.now()) return true

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) return false
    authCache.set(token, Date.now() + 5 * 60 * 1000)
    if (authCache.size > 50) {
      for (const [key, expires] of authCache) if (expires <= Date.now()) authCache.delete(key)
    }
    return true
  } catch (_) {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!(await authorised(req))) return res.status(401).json({ error: 'Sign in required' })

  let body = req.body || {}
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch (_) { return res.status(400).json({ error: 'Invalid request' }) }
  }

  const text = cleanText(body.text)
  const voice = ALLOWED_VOICES.has(body.voice) ? body.voice : 'en-GB-SoniaNeural'
  if (!text) return res.status(400).json({ error: 'No text to read' })
  if (text.length > 700) return res.status(413).json({ error: 'Text chunk is too long' })

  const tts = new MsEdgeTTS()
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text, {
      rate: rateFor(body.speed),
      pitch: '+0Hz',
      volume: 100,
    })

    res.statusCode = 200
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'private, no-store, max-age=0')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    await new Promise((resolve, reject) => {
      audioStream.on('error', reject)
      audioStream.on('end', resolve)
      req.on('aborted', () => {
        audioStream.destroy()
        resolve()
      })
      audioStream.pipe(res, { end: false })
    })

    tts.close()
    if (!res.writableEnded) res.end()
  } catch (error) {
    tts.close()
    console.error('Edge TTS failed:', error?.message || error)
    if (res.headersSent) {
      if (!res.writableEnded) res.end()
      return
    }
    return res.status(502).json({ error: 'Microsoft Edge voice is temporarily unavailable' })
  }
}

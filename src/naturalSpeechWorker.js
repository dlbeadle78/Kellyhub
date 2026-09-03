import { KokoroTTS } from 'kokoro-js'

let ttsPromise = null
let activeRequestId = null
let loadedDevice = null

async function detectDevice() {
  try {
    if (self.navigator?.gpu) {
      const adapter = await self.navigator.gpu.requestAdapter()
      if (adapter) return 'webgpu'
    }
  } catch (_) {}
  return 'wasm'
}

async function loadTTS(requestId) {
  const preferredDevice = await detectDevice()
  self.postMessage({ status: 'loading', requestId, device: preferredDevice, dtype: 'q8' })
  const modelId = 'onnx-community/Kokoro-82M-v1.0-ONNX'

  try {
    const tts = await KokoroTTS.from_pretrained(modelId, {
      dtype: 'q8',
      device: preferredDevice,
    })
    loadedDevice = preferredDevice
    return { tts, device: preferredDevice }
  } catch (error) {
    if (preferredDevice !== 'wasm') {
      self.postMessage({ status: 'loading', requestId, device: 'wasm', dtype: 'q8' })
      const tts = await KokoroTTS.from_pretrained(modelId, {
        dtype: 'q8',
        device: 'wasm',
      })
      loadedDevice = 'wasm'
      return { tts, device: 'wasm' }
    }
    throw error
  }
}

async function getTTS(requestId) {
  if (!ttsPromise) {
    ttsPromise = loadTTS(requestId).catch((error) => {
      ttsPromise = null
      loadedDevice = null
      throw error
    })
  }
  return ttsPromise
}

function splitText(text, maxChars = 300) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
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
    if (sentence.length <= maxChars) {
      current = sentence
      continue
    }
    const words = sentence.split(/\s+/)
    current = ''
    for (const word of words) {
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

self.addEventListener('message', async (event) => {
  const data = event.data || {}

  if (data.type === 'cancel') {
    if (!data.requestId || activeRequestId === data.requestId) activeRequestId = null
    return
  }

  if (data.type === 'warmup') {
    const requestId = data.requestId || 'warmup'
    try {
      const { device } = await getTTS(requestId)
      self.postMessage({ status: 'warmup-ready', requestId, device: device || loadedDevice, dtype: 'q8' })
    } catch (error) {
      self.postMessage({ status: 'warmup-error', requestId, message: error?.message || 'Natural voice warm-up failed.' })
    }
    return
  }

  if (data.type !== 'generate') return

  const requestId = data.requestId
  activeRequestId = requestId

  try {
    const { tts, device } = await getTTS(requestId)
    if (activeRequestId !== requestId) return
    self.postMessage({ status: 'ready', requestId, device, dtype: 'q8' })

    const chunks = splitText(data.text)
    if (!chunks.length) {
      self.postMessage({ status: 'done', requestId })
      return
    }

    for (let index = 0; index < chunks.length; index += 1) {
      if (activeRequestId !== requestId) return
      const audio = await tts.generate(chunks[index], {
        voice: data.voice || 'bf_emma',
        speed: Number(data.speed) || 1,
      })
      if (activeRequestId !== requestId) return
      const blob = audio.toBlob()
      self.postMessage({ status: 'audio', requestId, index, blob })
    }

    if (activeRequestId === requestId) {
      self.postMessage({ status: 'done', requestId })
      activeRequestId = null
    }
  } catch (error) {
    self.postMessage({ status: 'error', requestId, message: error?.message || 'Natural voice could not be loaded.' })
    if (activeRequestId === requestId) activeRequestId = null
  }
})

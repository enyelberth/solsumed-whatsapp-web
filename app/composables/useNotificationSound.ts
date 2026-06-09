let audioCtx: AudioContext | null = null
let lastPlayedAt = 0
let primed = false
let bufferLoaded = false
let buffer: AudioBuffer | null = null
let bufferLoadPromise: Promise<void> | null = null

const SOUND_URL = '/sounds/notification.mp3'

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  return audioCtx
}

async function loadBuffer(ctx: AudioContext): Promise<void> {
  if (bufferLoaded) return
  if (bufferLoadPromise) return bufferLoadPromise
  bufferLoadPromise = (async () => {
    try {
      const res = await fetch(SOUND_URL, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const arr = await res.arrayBuffer()
      buffer = await ctx.decodeAudioData(arr)
      bufferLoaded = true
    }
    catch (err) {
      // No hay archivo /sounds/notification.mp3 → caer a synth
      buffer = null
      bufferLoaded = true
      console.info('[notification-sound] mp3 ausente, usando synth fallback')
    }
  })()
  return bufferLoadPromise
}

export function primeNotificationSound() {
  if (primed) return
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  void loadBuffer(ctx)
  primed = true
}

function playBuffer(ctx: AudioContext, buf: AudioBuffer) {
  const src = ctx.createBufferSource()
  src.buffer = buf
  const gain = ctx.createGain()
  gain.gain.value = 1.0
  src.connect(gain).connect(ctx.destination)
  src.start()
}

/**
 * Imitación tipo "ding" de WhatsApp.
 * Bell-like: fundamental + armónicos con envolvente exponencial.
 */
function ringBell(ctx: AudioContext, startAt: number, fundamental: number, peakGain: number, duration: number) {
  const partials = [
    { mult: 1, gain: 1.0 },
    { mult: 2.0, gain: 0.45 },
    { mult: 3.01, gain: 0.22 },
    { mult: 4.2, gain: 0.10 },
  ]
  const mixer = ctx.createGain()
  mixer.gain.setValueAtTime(0, startAt)
  mixer.gain.linearRampToValueAtTime(peakGain, startAt + 0.005)
  mixer.gain.exponentialRampToValueAtTime(0.0008, startAt + duration)
  mixer.connect(ctx.destination)

  for (const p of partials) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(fundamental * p.mult, startAt)
    const g = ctx.createGain()
    g.gain.setValueAtTime(p.gain, startAt)
    g.gain.exponentialRampToValueAtTime(0.001, startAt + duration * 0.9)
    osc.connect(g).connect(mixer)
    osc.start(startAt)
    osc.stop(startAt + duration + 0.02)
  }
}

function playSynth(ctx: AudioContext) {
  const t0 = ctx.currentTime
  ringBell(ctx, t0, 932.33, 0.22, 0.42)
  ringBell(ctx, t0 + 0.09, 1174.66, 0.20, 0.48)
}

export function playNotificationSound() {
  if (typeof window === 'undefined') return
  const now = Date.now()
  if (now - lastPlayedAt < 800) return
  lastPlayedAt = now

  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  try {
    if (!bufferLoaded) {
      void loadBuffer(ctx).then(() => {
        if (buffer) playBuffer(ctx, buffer)
        else playSynth(ctx)
      })
      return
    }
    if (buffer) playBuffer(ctx, buffer)
    else playSynth(ctx)
  }
  catch (err) {
    console.warn('[notification-sound] play failed', err)
  }
}

import { create } from 'zustand'
import { Howl } from 'howler'

export type SoundName =
  | 'ambient_office_loop'
  | 'scenario_tension_loop'
  | 'ui_click'
  | 'ui_hover'
  | 'correct_sting'
  | 'wrong_glitch'
  | 'score_gain'
  | 'sms_notification'
  | 'phone_ring_landline'
  | 'door_knock'
  | 'email_notification'
  | 'keyboard_typing'
  | 'usb_insert'
  | 'system_alert'

interface AudioState {
  sounds: Map<string, Howl>
  unlocked: boolean
  muted: boolean
  init: () => void
  unlock: () => void
  play: (name: string) => void
  playSound: (name: SoundName) => void
  startLoop: (name: SoundName) => void
  stopLoop: (name: string) => void
  stopAllScenarioAudio: () => void
  stopAll: () => void
  fadeOut: (name: string, durationMs: number) => void
  fadeIn: (name: string, targetVolume: number, durationMs: number) => void
}

const CFG: Record<string, { volume: number; loop?: boolean }> = {
  ambient_office_loop:   { volume: 0.14, loop: true },
  scenario_tension_loop: { volume: 0.13, loop: true },
  ui_click:              { volume: 0.26 },
  ui_hover:              { volume: 0.10 },
  correct_sting:         { volume: 0.50 },
  wrong_glitch:          { volume: 0.45 },
  score_gain:            { volume: 0.38 },
  sms_notification:      { volume: 0.42 },
  phone_ring_landline:   { volume: 0.55, loop: true },
  door_knock:            { volume: 0.55 },
  email_notification:    { volume: 0.40 },
  keyboard_typing:       { volume: 0.18, loop: true },
  usb_insert:            { volume: 0.45 },
  system_alert:          { volume: 0.50 },
}

const fadeTimers: Record<string, ReturnType<typeof setInterval>> = {}
let lastHoverAt = 0

export const useAudioStore = create<AudioState>()((set, get) => ({
  sounds: new Map(),
  unlocked: false,
  muted: false,

  init() {
    if (get().sounds.size > 0) return
    const sounds = new Map<string, Howl>()
    for (const [name, cfg] of Object.entries(CFG)) {
      sounds.set(name, new Howl({
        src: [`/audio/${name}.mp3`],
        volume: cfg.volume,
        loop: cfg.loop ?? false,
        preload: true,
        html5: false,
        onloaderror: () => undefined,
        onplayerror: () => undefined,
      }))
    }
    set({ sounds })
  },

  unlock() {
    if (get().unlocked) return
    get().init()
    set({ unlocked: true })
    get().startLoop('ambient_office_loop')
  },

  play(name) {
    if (!get().unlocked || get().muted) return
    const s = get().sounds.get(name)
    if (!s) return
    if (name === 'ui_hover') {
      const now = Date.now()
      if (now - lastHoverAt < 160) return
      lastHoverAt = now
    }
    try {
      if (CFG[name]?.loop) {
        if (!s.playing()) s.play()
      } else {
        s.play()
      }
    } catch {
      return
    }
  },

  playSound(name) {
    get().play(name)
  },

  startLoop(name) {
    if (!get().unlocked || get().muted) return
    const s = get().sounds.get(name)
    if (!s) return
    try {
      if (!s.playing()) s.play()
    } catch {
      return
    }
  },

  stopLoop(name) {
    get().sounds.get(name)?.stop()
  },

  stopAllScenarioAudio() {
    get().stopLoop('scenario_tension_loop')
    get().stopLoop('phone_ring_landline')
  },

  stopAll() {
    Object.keys(fadeTimers).forEach((name) => {
      clearInterval(fadeTimers[name])
      delete fadeTimers[name]
    })
    get().sounds.forEach((sound) => {
      sound.stop()
      sound.unload()
    })
    set({ sounds: new Map(), unlocked: false })
  },

  fadeOut(name, durationMs) {
    const s = get().sounds.get(name)
    if (!s) return
    if (fadeTimers[name]) clearInterval(fadeTimers[name])
    const steps = 20
    const startVol = s.volume()
    let step = 0
    fadeTimers[name] = setInterval(() => {
      step++
      s.volume(Math.max(0, startVol * (1 - step / steps)))
      if (step >= steps) {
        clearInterval(fadeTimers[name])
        s.stop()
        s.volume(startVol)
      }
    }, durationMs / steps)
  },

  fadeIn(name, targetVolume, durationMs) {
    const s = get().sounds.get(name)
    if (!s || get().muted || !get().unlocked) return
    if (fadeTimers[name]) clearInterval(fadeTimers[name])
    if (s.playing()) return
    s.volume(0)
    s.play()
    const steps = 20
    let step = 0
    fadeTimers[name] = setInterval(() => {
      step++
      s.volume(Math.min(targetVolume, targetVolume * (step / steps)))
      if (step >= steps) {
        clearInterval(fadeTimers[name])
        s.volume(targetVolume)
      }
    }, durationMs / steps)
  },
}))

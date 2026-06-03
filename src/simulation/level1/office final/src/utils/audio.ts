import { useAudioStore, type SoundName } from '../stores/audioStore'

export function playSound(name: SoundName) {
  useAudioStore.getState().playSound(name)
}

export function startLoop(name: SoundName) {
  useAudioStore.getState().startLoop(name)
}

export function stopLoop(name: SoundName) {
  useAudioStore.getState().stopLoop(name)
}

export function stopAllScenarioAudio() {
  useAudioStore.getState().stopAllScenarioAudio()
}

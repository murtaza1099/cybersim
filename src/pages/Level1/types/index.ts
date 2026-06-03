export type FocusMode = 'free' | 'point' | 'windows' | 'android'
export type ActiveLayer = 'scene' | 'briefing' | 'context' | 'scenario' | 'feedback' | 'complete'

export type GameEvent = {
  id: string
  ts: number
  type: string
  pointId?: number
  payload?: Record<string, unknown>
}

export type AppName = 'outlook' | 'browser' | 'fileExplorer' | 'messages' | 'dialer'

export type TriggerOS = 'windows' | 'android' | 'scene'

export interface AttackPointDef {
  id: number
  displayName: string
  label: string
  tag: string
  anchorKey: string
  camKey: string
  triggerOS: TriggerOS
  appToOpen: AppName | null
  audioCue: string
  scoreReward: number
  briefing: string
  isAttack: boolean
  normalContext: string | null
  hint: string
  // In-world clock time this scenario fires (HH:MM). Drives the HUD clock.
  time: string
  // Scenario context card (Task 3). ATK_007 keeps its bespoke DeliveryCard and
  // omits these — they are optional for that reason.
  contextIcon?: string
  contextHeader?: string
  contextNarrative?: string
  actionLabel?: string
  // Some scenarios (USB drop) have a second, "do nothing" option that is correct.
  actionLabelSecondary?: string
  secondaryIsCorrect?: boolean
  // Sound to play when the scenario-context card opens (Task 3). ATK_007 omits it.
  contextAudioCue?: string
}

export interface OpenApp {
  id: string
  appName: AppName
  minimized: boolean
  maximized: boolean
  zIndex: number
}

export type WindowsAction =
  | { type: 'OPEN_APP'; appName: AppName }
  | { type: 'CLOSE_APP'; id: string }
  | { type: 'FOCUS_APP'; id: string }
  | { type: 'MINIMIZE'; id: string }
  | { type: 'MAXIMIZE'; id: string }

export type AndroidAction =
  | { type: 'OPEN'; screen: string }
  | { type: 'BACK' }
  | { type: 'HOME' }

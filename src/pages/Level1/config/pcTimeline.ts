import type { PcSubAttackId } from '../types'

// ─── Declarative workday timeline for the Main Workstation session ────────────
// Time-triggered (`at`, ms after session start) or action-triggered (`on` + `delay`).
// `legit: true` events are benign ambient activity — reporting them is a false
// positive. `attackId` ties an event to a trainable sub-attack.

export type PcToastIcon = 'shield' | 'mail' | 'browser' | 'excel' | 'teams' | 'calendar'
export type PcToastAction = 'openDefender'

export interface PcToast {
  icon: PcToastIcon
  title: string
  body: string
  actionLabel?: string
  action?: PcToastAction
}

export interface PcTimelineEvent {
  id: string
  at?: number       // ms after startSession (time-triggered)
  on?: string       // action trigger, e.g. 'browser:opened'
  delay?: number    // ms after the action fires
  attackId?: PcSubAttackId
  legit?: boolean   // benign ambient activity
  toast?: PcToast
}

export const PC_TIMELINE: PcTimelineEvent[] = [
  // Every email arrives with its own notification (nothing is pre-loaded), spaced
  // ~5–6s apart so they come in one at a time. Emails appear in the inbox below the
  // existing ones, in arrival order.

  // Phase 1 — the easy phish lands first.
  { id: 'phish_email', at: 3000, attackId: 'email_phish', toast: { icon: 'mail', title: 'New email', body: 'Microsoft Account Team — Unusual sign-in' } },

  // Ambient life — a benign Teams ping so attacks have normal activity to hide in.
  { id: 'standup', at: 8000, legit: true, toast: { icon: 'teams', title: 'Priya Sharma · Teams', body: 'Morning! Standup in 10 🙌' } },

  // Benign internal email (good for calibration — reporting it is a false positive).
  { id: 'manager_email', at: 13000, legit: true, toast: { icon: 'mail', title: 'New email', body: 'Priya Sharma — RE: 1:1 agenda' } },

  // Phase 2 — authority + urgency.
  { id: 'ceo_email', at: 19000, attackId: 'ceo_fraud', toast: { icon: 'mail', title: 'New email', body: 'David Walsh (CEO) — URGENT' } },

  // More benign noise.
  { id: 'newsletter', at: 26000, legit: true, toast: { icon: 'mail', title: 'New email', body: 'TechCorp Weekly — March digest' } },

  // Phase 2 — browser nudge; the fake update page itself is action-triggered (appears
  // shortly after the browser opens).
  { id: 'browser_nudge', at: 32000, toast: { icon: 'browser', title: 'Chrome', body: 'A page says Chrome must be updated before you continue.' } },
  { id: 'clickfix', on: 'browser:opened', delay: 1500, attackId: 'clickfix' },

  // Phase 4 — calibration trap: looks alarming, is genuinely legit. Reporting it
  // is a false positive. Trains "verify, don't just suspect".
  { id: 'it_policy', at: 38000, legit: true, toast: { icon: 'mail', title: 'New email', body: 'IT Helpdesk — password policy update' } },

  // Phase 2 — curiosity.
  { id: 'macro_doc', at: 44000, attackId: 'macro_doc', toast: { icon: 'excel', title: 'New attachment', body: 'LinkedIn Recruiter — Portfolio.pdf .exe' } },

  // Phase 3 — fear.
  { id: 'fake_defender', at: 50000, attackId: 'fake_defender', toast: { icon: 'shield', title: 'Windows Security', body: 'Threat found: Trojan:Win32/Wacatac.B!ml — action required', actionLabel: 'See details', action: 'openDefender' } },
]

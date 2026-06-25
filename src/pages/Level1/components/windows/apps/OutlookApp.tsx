import { useState } from 'react'
import { usePcStore } from '../../../stores/pcStore'
import { colors, fonts } from '../../../styles/theme'
import type { PcSubAttackId } from '../../../types'

const mono: React.CSSProperties = { fontFamily: fonts.mono }
const neutralDecisionButton: React.CSSProperties = {
  flex: 1,
  padding: '9px 0',
  borderRadius: 6,
  cursor: 'pointer',
  background: 'transparent',
  border: '1px solid rgba(0,240,255,0.28)',
  color: colors.textPrimary,
  ...mono,
  fontSize: 11,
}
const ordinaryLinkButton: React.CSSProperties = {
  padding: 0,
  background: 'transparent',
  border: 'none',
  color: colors.textPrimary,
  ...mono,
  fontSize: 12,
  cursor: 'pointer',
  textDecoration: 'underline',
}

type Outcome = 'pass' | 'fail' | 'fp' | 'archived'

interface BodyLine { t: 'text' | 'info'; text: string }
interface Mail {
  key: string
  firedKey?: string          // visibility gate (undefined = always present)
  attackId?: PcSubAttackId   // present → this email IS a trainable attack
  legit?: boolean
  calibration?: boolean      // looks suspicious but is genuinely legitimate
  reportEventId?: string     // for false-positive tracking (legit only)
  from: string
  replyTo?: string
  display: string
  external?: boolean
  realDomain: string         // revealed when the sender is expanded
  domainTip: string
  domainOk: boolean
  subject: string
  body: BodyLine[]
  link?: { label: string; url: string }   // malicious in-body link (phish)
  maliciousLabel?: string    // malicious action-bar button (ceo)
  safeLabel: string          // safe action-bar button (attack)
}

const MAILS: Mail[] = [
  {
    key: 'phish', firedKey: 'phish_email', attackId: 'email_phish',
    from: 'IT-Security@micros0ft-helpdesk.net', display: 'Microsoft Account Team',
    replyTo: 'security-notice@account-microsoft-verify.com', external: true,
    realDomain: 'micros0ft-helpdesk.net', domainOk: false,
    domainTip: '“micros0ft” uses a zero (0), and the domain is not microsoft.com',
    subject: '⚠ Unusual sign-in — verify within 24h or lose access',
    body: [
      { t: 'text', text: 'Dear User,\n\nWe detected an unusual sign-in to your Microsoft 365 account. To keep your account active you must verify your identity within 24 hours.\n' },
      { t: 'info', text: 'Location: Novosibirsk, Russia · Device: Unknown · 03:42 AM · Case ID: MS-778421' },
      { t: 'text', text: '\n\nVerify your identity here:' },
      { t: 'text', text: '\n\nRegards,\nMicrosoft account services\nSecurity notifications team\n\nThis message was sent by an automated mailbox. Microsoft will never ask for your password by email.' },
    ],
    link: { label: 'VERIFY NOW →', url: 'http://account-microsoft-verify.com/login' },
    safeLabel: '[ REPORT PHISHING ]',
  },
  {
    key: 'manager', firedKey: 'manager_email', legit: true, reportEventId: 'manager',
    from: 'priya.sharma@techcorp.com', display: 'Priya Sharma',
    realDomain: 'techcorp.com', domainOk: true, domainTip: 'matches the company domain',
    subject: 'RE: 1:1 agenda for today',
    body: [
      { t: 'text', text: 'Hi,\n\nFor our 1:1 at 15:00 — let’s cover the Q2 roadmap, your training plan, and the new starter onboarding. No prep needed.\n\nSee you then,\nPriya' },
    ],
    safeLabel: '[ REPORT PHISHING ]',
  },
  {
    key: 'ceo', firedKey: 'ceo_email', attackId: 'ceo_fraud',
    from: 'david.walsh@techc0rp-hq.com', display: 'David Walsh (CEO)',
    external: true,
    realDomain: 'techc0rp-hq.com', domainOk: false,
    domainTip: '“techc0rp-hq.com” — a zero and a hyphen. The real domain is techcorp.com',
    subject: 'URGENT — Confidential transfer request',
    body: [
      { t: 'text', text: 'I’m in back-to-back meetings and can’t talk. I need you to process a supplier payment of £12,500 in the next 30 minutes — new vendor, details below.\n\nKeep this between us for now, don’t loop in finance until it’s done. I’m counting on you.\n\nSent from my iPhone\n\n' },
      { t: 'info', text: '---------- Forwarded message ---------\nFrom: Megan Patel <megan.patel@northbridge-supplies.co>\nDate: Tue, 14 Mar, 14:57\nSubject: Updated remittance details' },
      { t: 'text', text: '\n\nDavid,\n\nAs discussed, please use the revised beneficiary account for today’s settlement. The previous invoice reference still applies.\n\nMegan' },
    ],
    maliciousLabel: 'Reply — I’ll process this',
    safeLabel: 'Verify by phone / report to finance',
  },
  {
    key: 'newsletter', firedKey: 'newsletter', legit: true, reportEventId: 'newsletter',
    from: 'news@techcorp.com', display: 'TechCorp Comms',
    realDomain: 'techcorp.com', domainOk: true, domainTip: 'matches the company domain',
    subject: 'TechCorp Weekly — March digest',
    body: [
      { t: 'text', text: 'This week: the new café menu, a reminder about hybrid days, and three open roles in Engineering. Have a great week!\n\n— Internal Comms' },
    ],
    safeLabel: '[ REPORT PHISHING ]',
  },
  {
    // CALIBRATION TRAP — looks alarming (urgency, deadline, a typo) but is a real
    // internal notice: correct domain, no link, points to the known portal.
    key: 'it_policy', firedKey: 'it_policy', legit: true, calibration: true, reportEventId: 'it_policy',
    from: 'it-helpdesk@techcorp.com', display: 'IT Helpdesk',
    realDomain: 'techcorp.com', domainOk: true, domainTip: 'matches the company domain',
    subject: '⚠ ACTION REQUIRED: Password policy update — reset by Friday',
    body: [
      { t: 'text', text: 'Hi all,\n\nAs part of our quarterly security review, all staff must update there password before Friday 17:00. Please do this via the usual Company Portal (Settings → Security → Change Password).\n\n' },
      { t: 'info', text: 'We will NEVER email you a reset link — ignore and report any message that contains one.' },
      { t: 'text', text: '\n\nThanks,\nIT Helpdesk' },
    ],
    safeLabel: '[ REPORT PHISHING ]',
  },
]

export default function OutlookApp() {
  const fired           = usePcStore(s => s.fired)
  const firedAt         = usePcStore(s => s.firedAt)
  const recordInspection = usePcStore(s => s.recordInspection)
  const resolveAttack   = usePcStore(s => s.resolveAttack)
  const reportLegit     = usePcStore(s => s.reportLegit)

  // Emails appear only once their notification fires, ordered by arrival (newest last).
  const visible = MAILS
    .filter(m => m.firedKey && fired[m.firedKey])
    .sort((a, b) => (firedAt[a.firedKey ?? ''] ?? 0) - (firedAt[b.firedKey ?? ''] ?? 0))
  const [selected, setSelected] = useState<string>('phish')
  const [expanded, setExpanded] = useState(false)
  const [hoverLink, setHoverLink] = useState(false)
  const [outcomes, setOutcomes]   = useState<Record<string, Outcome>>({})

  const mail = visible.find(m => m.key === selected) ?? visible[0]
  const outcome = mail ? outcomes[mail.key] : undefined

  // Inbox starts empty — messages arrive as their notifications fire.
  if (!mail) {
    return (
      <div style={{ display: 'flex', height: '100%', background: '#1b1b1b', color: '#9aa0a6', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.body }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.display, fontSize: 11, color: colors.cyan, letterSpacing: '0.12em', marginBottom: 8 }}>INBOX (0)</div>
          <div style={{ fontSize: 13 }}>No messages yet.</div>
        </div>
      </div>
    )
  }

  const select = (key: string) => { setSelected(key); setExpanded(false); setHoverLink(false) }

  const inspectSender = () => {
    setExpanded(true)
    if (mail.attackId) recordInspection(mail.attackId, 'sender')
  }
  const onHoverLink = () => {
    setHoverLink(true)
    if (mail.attackId) recordInspection(mail.attackId, 'link')
  }

  const setOutcome = (o: Outcome) => setOutcomes(prev => ({ ...prev, [mail.key]: o }))

  const handleMalicious = () => {
    if (mail.attackId) resolveAttack(mail.attackId, false, mail.maliciousLabel ?? mail.link?.label ?? 'clicked')
    setOutcome('fail')
  }
  const handleSafe = () => {
    if (mail.attackId) { resolveAttack(mail.attackId, true, 'reported'); setOutcome('pass') }
    else if (mail.legit) { reportLegit(mail.reportEventId ?? mail.key); setOutcome('fp') }
  }
  const handleArchive = () => setOutcome('archived')

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1b1b1b', color: '#e5e7eb' }}>
      {/* Mail list */}
      <div style={{ width: '36%', borderRight: '1px solid #2a2a2a', overflowY: 'auto', background: '#202020' }}>
        <div style={{ padding: '10px 14px', fontFamily: fonts.display, fontSize: 11, color: colors.cyan, borderBottom: '1px solid #2a2a2a' }}>
          INBOX ({visible.length})
        </div>
        {visible.map(m => {
          const done = outcomes[m.key]
          return (
            <div key={m.key} onClick={() => select(m.key)} style={{
              padding: '10px 26px 10px 14px', borderBottom: '1px solid #2a2a2a', cursor: 'pointer',
              background: selected === m.key ? '#2d2d2d' : 'transparent', position: 'relative',
            }}>
              {/* Neutral styling — no red, so attacks aren't given away before inspection */}
              <div style={{ ...mono, fontSize: 11, color: '#9aa0a6', marginBottom: 2 }}>{m.display}</div>
              <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: done ? 400 : 600, opacity: done ? 0.55 : 1 }}>{m.subject}</div>
              {done ? (
                <span style={{ position: 'absolute', top: 12, right: 12, ...mono, fontSize: 10, color: done === 'pass' ? colors.green : done === 'fail' || done === 'fp' ? colors.red : colors.textDim }}>
                  {done === 'pass' ? '✓' : done === 'archived' ? '—' : '✕'}
                </span>
              ) : (
                <span style={{ position: 'absolute', top: 15, right: 13, width: 7, height: 7, borderRadius: '50%', background: '#4cc2ff' }} title="Unread" />
              )}
            </div>
          )
        })}
      </div>

      {/* Reader */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 12px', minHeight: 0 }}>
          <div style={{ fontFamily: fonts.display, fontSize: 14, color: '#f3f4f6', marginBottom: 8 }}>{mail.subject}</div>

          {mail.external && (
            <div style={{ ...mono, fontSize: 10.5, color: colors.amber, background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.24)', borderRadius: 5, padding: '7px 10px', marginBottom: 10 }}>
              External sender: this message originated outside TechCorp. Verify sender and reply-to before acting.
            </div>
          )}

          {/* Sender + expandable inspection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ ...mono, fontSize: 11, color: '#9aa0a6' }}>From: {mail.display}</div>
            <button onClick={inspectSender} style={{ ...mono, fontSize: 10, background: 'none', border: '1px solid #3a3a3a', color: '#9aa0a6', borderRadius: 4, padding: '1px 7px', cursor: 'pointer' }}>▾ details</button>
          </div>
          {expanded && (
            <div style={{ ...mono, fontSize: 10.5, lineHeight: 1.6, marginBottom: 14, padding: '7px 10px', borderRadius: 5, background: mail.domainOk ? 'rgba(0,255,136,0.06)' : 'rgba(255,51,85,0.07)', border: `1px solid ${mail.domainOk ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,85,0.3)'}` }}>
              <div style={{ color: '#cdd6e3' }}>From: {mail.from}</div>
              {mail.replyTo && <div style={{ color: '#cdd6e3' }}>Reply-To: {mail.replyTo}</div>}
              <div style={{ color: mail.domainOk ? colors.green : '#ff8da3', marginTop: 3 }}>
                {mail.domainOk ? '✓' : '⚠'} {mail.realDomain} — {mail.domainTip}
              </div>
            </div>
          )}

          {/* Body */}
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: '#c8c8c8', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {mail.body.map((p, i) => p.t === 'info'
              ? <span key={i} style={{ color: colors.amber, ...mono, fontSize: 12 }}>{p.text}</span>
              : <span key={i}>{p.text}</span>)}
          </div>

          {mail.link && !outcome && (
            <div style={{ marginTop: 12 }}>
              <button onMouseEnter={onHoverLink} onMouseLeave={() => setHoverLink(false)} onClick={handleMalicious} style={ordinaryLinkButton}>{mail.link.label}</button>
              {hoverLink && <div style={{ marginTop: 8, ...mono, fontSize: 10, color: colors.textMuted, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,240,255,0.16)', padding: '3px 8px', borderRadius: 3, display: 'inline-block' }}>→ {mail.link.url}</div>}
            </div>
          )}
        </div>

        {/* Action bar / feedback */}
        {!outcome ? (
          <div style={{ padding: '12px 22px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: 10, background: '#202020', flexShrink: 0 }}>
            {mail.maliciousLabel && (
              <button onClick={handleMalicious} style={neutralDecisionButton}>{mail.maliciousLabel}</button>
            )}
            {mail.attackId
              ? <button onClick={handleSafe} style={neutralDecisionButton}>{mail.safeLabel}</button>
              : <>
                  <button onClick={handleSafe} style={neutralDecisionButton}>Report as phishing</button>
                  <button onClick={handleArchive} style={neutralDecisionButton}>{mail.calibration ? 'Verify with IT & proceed' : 'Looks fine — archive'}</button>
                </>}
          </div>
        ) : (
          <FeedbackBar mail={mail} outcome={outcome} />
        )}
      </div>
    </div>
  )
}

function FeedbackBar({ mail, outcome }: { mail: Mail; outcome: Outcome }) {
  const good = outcome === 'pass' || outcome === 'archived'
  const msg =
    outcome === 'pass'   ? `Reported. The tell: ${mail.domainTip}.`
  : outcome === 'fail'   ? (mail.attackId === 'ceo_fraud'
      ? 'Wire sent to the attacker. BEC fingerprint: authority + extreme urgency + secrecy + a near-miss domain. Always confirm payments out-of-band.'
      : 'Credentials captured on a spoofed login page. Always check the sender domain character-by-character before clicking.')
  : outcome === 'fp'     ? (mail.calibration
      ? 'That was a genuine IT notice — real domain, no link, and it points to the internal portal. Over-reporting real alerts causes alert fatigue and buries the actual threats. Verify before you escalate.'
      : 'That email was legitimate. Over-reporting causes alert fatigue and buries the real threats — verify before you escalate.')
  :                        (mail.calibration
      ? 'Well judged. It looked urgent, but the domain was real, there was no link, and it pointed to the internal portal — you verified instead of panicking.'
      : 'Archived. Correct — nothing suspicious here.')
  return (
    <div style={{ padding: '12px 22px', borderTop: `1px solid ${good ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,85,0.3)'}`, background: good ? 'rgba(0,255,136,0.05)' : 'rgba(255,51,85,0.05)', flexShrink: 0 }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: good ? colors.green : colors.red, marginBottom: 5 }}>
        {outcome === 'pass' ? '✓ THREAT REPORTED' : outcome === 'archived' ? '✓ NO ACTION NEEDED' : outcome === 'fp' ? '⚠ FALSE POSITIVE' : '✕ SECURITY FAILURE'}
      </div>
      <div style={{ fontFamily: fonts.body, fontSize: 12.5, color: good ? '#a7f3d0' : '#ffb3bf', lineHeight: 1.6 }}>{msg}</div>
    </div>
  )
}

# CyberSim Hub

## Level 1 Timed Simulation

Level 1 now runs as a timed, data-driven simulation with decoys and real attacks.

- Event definitions: `src/simulation/level1/game/level1Events.ts`
- Engine (timeline expansion + centralized scoring): `src/simulation/level1/game/level1Engine.ts`
- Overlay UI + scheduler runtime: `src/simulation/level1/components/Level1TimedThreats.tsx`

### How To Add New Events

1. Add a new event object in `LEVEL1_EVENTS`.
2. Provide:
	- `id`, `triggerTimeMs`, `type`, `title`, `body`
	- `actions` (button labels)
	- `correctActionLabel` and `explanation`
	- `scoring` rules (`riskyActions`, `comboActions`, `actionScores`, etc.)
3. If the event should repeat, add:
	- `repeat: { count, intervalMs }`
4. The scheduler automatically expands and orders events via `expandTimeline`.

### How To Add Voice Lines

Add a `voice` block to any event:

```ts
voice: {
  text: 'Spoken script goes here',
  autoplay: true,
}
```

Notes:

- Voice playback uses Web Speech API TTS.
- UI has a `Voice On/Off` switch.
- A `Play Voice` button is shown on voiced popups for manual replay.

### How Repeats Work

Repeats are expanded into additional scheduled instances:

- Base trigger at `triggerTimeMs`
- Additional triggers at `triggerTimeMs + n * intervalMs`
- `count` controls how many extra repeats are emitted

For repeated security prompts (like MFA bombing), once the base event is resolved, future repeats are ignored.

### Tests

Level 1 engine tests are in:

- `src/simulation/level1/game/level1Engine.test.ts`

They verify:

- timeline scheduling order and repeat expansion
- risky scoring
- voice-event scoring
- MFA combo handling (deny + report)

# 🎯 AimCoach AI

> **An AI-powered aim trainer that doesn't just score you — it coaches you.**

AimCoach AI is a professional-grade aim training platform that analyzes your
mouse mechanics in real time, detects *why* you miss, and produces
confidence-scored, game-specific recommendations — the kind of feedback you'd
normally pay an esports coach for.

This is not a basic aim-trainer clone. Every shot is instrumented. The engine
measures velocity, acceleration, path smoothness, flick angle, overshoot,
correction count, and reaction delay, then runs that data through a pattern
detector and a recommendation engine that talks to you like a real coach.

---

## ✨ What makes it different

| Most aim trainers | AimCoach AI |
| --- | --- |
| Show hits / misses / accuracy | Detects **why** you miss (overflick, jitter, slow reaction, tracking drift) |
| One generic score | A **7-dimensional weakness profile** built over time |
| "Get better" | *"Your sensitivity is too high — reduce Valorant 0.32 → 0.28. Confidence: 82%"* |
| Static drills | A **Personalized mode** generated from your specific weaknesses |

---

## 🧠 The AI Coach

After every session the analytics engine produces a **WeaknessProfile** across
seven dimensions:

- **Overflicking** — overshooting target centers
- **Underflicking** — stopping short of targets
- **Tracking deviation** — drift while following moving targets
- **Jitter** — high-frequency shake in your mouse path
- **Reaction slowness** — time from spawn to first movement
- **Precision issues** — landing accuracy on small targets
- **Speed sacrifice** — being accurate but too slow to commit

The **Recommendation Engine** turns that profile into actionable advice with a
**confidence score** (`sampleStrength × 40 + severity × 50 + consistency × 10`)
and concrete sensitivity conversions for Valorant, CS2, and Apex.

> **Example output**
> *"Sensitivity May Be Too High — You overshot targets 31% of shots, 6% above
> baseline. Recommended: Valorant 0.32 → 0.28. Confidence: 82%."*

---

## 🎮 Game Modes

1. **Flick** — single static targets, random spawns. Tests flick precision & overshoot.
2. **Tracking** — a moving target that bounces and accelerates. Tests smooth following.
3. **Precision** — tiny targets, longer timeout. Tests micro-adjustment control.
4. **Reaction** — targets appear after a random delay and vanish fast. Pure reaction speed.
5. **Stress** — multiple simultaneous targets under escalating pressure. Tests target switching.
6. **Personalized** — adaptively generated: 40% your weakest skill, 30% second weakest, 30% mixed.

---

## 📊 Dashboard & Gamification

- Dark, futuristic esports UI (purple / cyan glow theme)
- Animated charts: accuracy trends, reaction-time distribution, improvement curve
- Canvas-based **click heatmap** (miss distribution relative to target center)
- **Rank system**: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
- **XP, levels, streaks, and achievements** ("Speed Demon", "Ghost Aim", "Flick Master"…)
- Full **session history** with per-session metrics and recommendations

---

## 🏗️ Architecture

A clean, modular monorepo (npm workspaces) with strict separation of concerns:

```
client/                  React 18 + TypeScript + Vite
  src/
    game/                Canvas engine — game loop, mouse physics, targets, particles
      modes/             One file per game mode (extends BaseMode)
    analytics/           AimAnalyzer · RecommendationEngine · pattern thresholds
    store/               Zustand stores (game · player · session)
    components/          Dashboard · Game · Charts · UI primitives
    types/               Shared domain types
server/                  Express + better-sqlite3
  src/
    routes/              /api/player · /api/sessions · /api/stats
    services/            Business logic
    db/                  SQLite schema & connection
```

**Design principles**

- **The game engine is framework-agnostic.** All measurement lives in plain
  TypeScript classes (`GameEngine`, `MouseTracker`, `MetricsCollector`) — React
  only renders. This keeps the hot 60fps loop out of React's render cycle.
- **Modes are pluggable.** Each mode extends `BaseMode`; adding a new drill
  means one new file, no engine changes.
- **Analytics is pure.** `AimAnalyzer` and `RecommendationEngine` are pure
  functions over metrics — trivially testable, no side effects.
- **Persistence is layered.** Works fully client-side via `localStorage`; the
  Express + SQLite backend is ready for multi-device sync and leaderboards.

### Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React 18 + TypeScript | Type-safe, component-driven |
| Build | Vite | Instant HMR, fast builds |
| Game | Canvas 2D | Full control over per-frame measurement |
| State | Zustand | Minimal, TS-first, no boilerplate |
| Charts | Recharts | Composable, clean analytics |
| Backend | Express + better-sqlite3 | Simple, synchronous, zero-config |
| Styling | Tailwind CSS | Themed via CSS variables |

---

## 🚀 Getting Started

```bash
# Install all workspaces
npm install --legacy-peer-deps

# Run client + server together
npm run dev

# Or individually
npm run dev --workspace=client   # Vite dev server (http://localhost:5173)
npm run dev --workspace=server   # API server (http://localhost:3001)

# Production build
npm run build
```

> **Tip:** AimCoach AI uses **pointer lock** during gameplay for raw mouse input
> (just like a real FPS). Click the canvas to lock, press `Esc` to release.

---

## 🔬 How the measurement works

- **Overshoot / undershoot** — the click offset from target center is projected
  onto the *approach direction* (last 5 frames of motion). A positive projection
  beyond the target edge = overshoot; a negative one = undershoot.
- **Jitter** — standard deviation of frame-to-frame angular change over the last
  20 samples, in degrees. Low grip stability shows up as high jitter.
- **Correction count** — number of times distance-to-target reverses from
  decreasing to increasing during the approach (i.e. how many times you
  "re-aimed").
- **Fatigue index** — compares accuracy in the first 20% of a session vs. the
  last 20% to detect performance decline.
- **Path smoothness** — how close your cursor path is to a straight line
  (average turn angle, normalized).

---

## 🗺️ Roadmap

- [x] Core engine + 6 game modes
- [x] Real-time metrics collection
- [x] Weakness detection + recommendation engine
- [x] Dashboard, charts, heatmap
- [x] XP / rank / streak / achievements
- [ ] Server-synced profiles & global leaderboards
- [ ] Sensitivity-finder calibration wizard
- [ ] Replay viewer (visualize your mouse path per shot)
- [ ] Import real game sensitivities for true-to-game conversion

---

*Built to feel like a real product — train smarter, not just harder.* 🎯

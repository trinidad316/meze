# gen-health

Personalized Mediterranean meal planner. AI-powered suggestions tailored to a specific health profile (Sjögren's syndrome, anti-inflammatory diet, GI recovery). Learns preferences over time.

Built with Expo (iOS, Android, web) + Anthropic API.

## Setup

```bash
cp .env.example .env
# add your ANTHROPIC_API_KEY (console.anthropic.com)

pnpm install
pnpm dev   # proxy + Expo (browser)
pnpm app   # proxy + Expo + Electron desktop window
```

Press `w` for web, `i` for iOS simulator, `a` for Android.

Or double-click `launch.command` on macOS to open as a desktop app (Electron, iPhone-sized window).

## How it works

1. **Suggest** — tap "+ Get suggestions" on any meal slot to fetch 3 options on demand
2. **Pick** — select one per slot (breakfast, mid-morning, lunch, afternoon, dinner × 3 days + Sunday)
3. **More** — don't like the options? fetch 3 fresh ones for that slot
4. **Recipe** — tap "▼ Get recipe" on a selected meal for full instructions + chef tips
5. **Shopping list** — tap "▼ Build Shopping List" to generate a grouped list (Produce / Protein / Dairy / Pantry) from all your selections

## Cost

Uses `claude-sonnet-4-20250514`. Approximate costs per action:

| Action | Cost |
|---|---|
| Get suggestions (per slot) | ~$0.003 |
| Get recipe | ~$0.010 |
| Build shopping list | ~$0.005 |

A full week of planning (suggestions + recipes + shopping list) runs **~$0.10–0.15**. A $5 API credit covers roughly 35–50 sessions.

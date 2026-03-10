# Meze

Personal meal planner built on the Mediterranean diet — suggests options per slot, learns your taste through ratings, fetches full recipes on demand, and generates a consolidated shopping list. Runs as a native macOS desktop app.

Built with Expo (React Native) + Anthropic API + Electron.

## Setup

```bash
cp .env.example .env
# add your ANTHROPIC_API_KEY (console.anthropic.com)

pnpm install
pnpm dev   # proxy + Expo (browser)
pnpm app   # proxy + Expo + Electron desktop window
```

Press `w` for web, `i` for iOS simulator, `a` for Android.

Or double-click `electron/launch.command` on macOS to open as a desktop app (Electron, iPhone-sized window).

## How it works

1. **Suggest** — tap "+ Get suggestions" on any meal slot to fetch 3 options on demand
2. **Pick** — select one per slot (breakfast, mid-morning, lunch, afternoon, dinner × 3 days + Sunday)
3. **More** — don't like the options? fetch 3 fresh ones for that slot
4. **Rate** — tap 1–5 stars on any meal; ratings persist and feed back into future suggestions (favorites get suggested more, low-rated meals get avoided)
5. **Recipe** — tap "▼ Get recipe" on a selected meal for full instructions + chef tips
6. **Shopping list** — tap "▼ Build Shopping List" to generate a grouped list (Produce / Protein / Dairy / Pantry) from all your selections

## Release (macOS desktop app)

Builds a standalone `.app` — no terminal, no dev server. Double-click from Applications.

```bash
pnpm build:app
```

This runs `expo export --platform web` then `electron-builder --mac`. Output lands in `release/mac-arm64/Meze.app`.

**Install:**
```bash
cp -r release/mac-arm64/Meze.app /Applications/
```

The app bundles its own proxy server and serves the pre-built web files internally. Your `.env` (with `ANTHROPIC_API_KEY`) is bundled at build time — update the key and rebuild if you rotate it.

## Versioning

Releases are managed with [release-please](https://github.com/googleapis/release-please). On every push to `main`, a GitHub Action opens (or updates) a Release PR with an auto-bumped version and changelog.

**Commit prefix → version bump:**

| Prefix | Bump |
|---|---|
| `fix: ...` | patch (1.0.0 → 1.0.1) |
| `feat: ...` | minor (1.0.0 → 1.1.0) |
| `feat!:` or `BREAKING CHANGE:` in body | major (1.0.0 → 2.0.0) |
| `chore:`, `refactor:`, `docs:` | no bump |

Merge the Release PR when you're ready to cut a release — it updates `package.json`, commits `CHANGELOG.md`, and tags the release automatically.

## Cost

Uses `claude-sonnet-4-20250514`. Approximate costs per action:

| Action | Cost |
|---|---|
| Get suggestions (per slot) | ~$0.003 |
| Get recipe | ~$0.010 |
| Build shopping list | ~$0.005 |

A full week of planning (suggestions + recipes + shopping list) runs **~$0.10–0.15**. A $5 API credit covers roughly 35–50 sessions.

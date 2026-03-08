# gen-health — CLAUDE.md

## Stack
- **Expo + React Native** (expo-router, file-based routing)
- **Storage:** `AsyncStorage` — key `med_diet_prefs`
- **API:** Anthropic `/v1/messages`, model `claude-sonnet-4-20250514`, via local Express proxy (`server.mjs` on port 3001)
- **Styling:** `StyleSheet.create` inline styles only

## User Profile (injected into every API call)
- Sjögren's syndrome — all food must be moist, no dry/crumbly textures
- Anti-inflammatory Mediterranean diet, high protein, GI-gentle
- Low spice, light dairy, lives alone (ingredient reuse critical)
- Flavor-forward: herbs, lemon, garlic, olive oil, capers, olives
- Appliances: cast iron, sheet pan/oven, stovetop, blender — no Instant Pot
- Proteins: chicken, salmon, eggs, turkey, legumes

## App Flow
1. **Suggest** — per-slot on-demand API call returns 3 options (~500 tokens)
2. **Select** — user picks one option per slot; selection persists to `AsyncStorage`
3. **More** — per-slot API call for 3 fresh options, excluding already-shown (~500 tokens)
4. **Get Recipe** — on-demand API call for full recipe of selected meal (~900 tokens)
5. **Shopping List** — one API call across all selections, returns grouped list by category (~600 tokens)

## Meal Slots
`breakfast` · `midmorning` · `lunch` · `afternoon` · `dinner` (× 3 days + Sunday extended/lighter)

## API Schemas

**Generate plan** response per option:
```json
{ "id", "name", "description", "key_ingredients": ["2-3 fresh items"] }
```

**Recipe** response:
```json
{ "prep_time", "appliance", "ingredients", "instructions", "chef_tips", "sjogrens_note" }
```

**Shopping list** response:
```json
{ "produce": ["..."], "protein": ["..."], "dairy": ["..."], "pantry": ["..."] }
```

## Prefs Shape
```js
{ selections: { "day0_breakfast": { id, name, description, key_ingredients }, ... }, liked: [], disliked: [] }
```
Last 10 liked/disliked injected into system prompt on next generate.

## Files
```
app/_layout.jsx     root layout (expo-router)
app/index.jsx       full app — MealPlanner, MealSlot, RecipeView, ShoppingList, SundaySlots
server.mjs          Express proxy → Anthropic API (port 3001)
.env                ANTHROPIC_API_KEY
```

## Dev
```bash
pnpm dev      # proxy + expo together (concurrently)
pnpm server   # proxy only
pnpm start    # expo only (w=web, i=iOS, a=Android)
```

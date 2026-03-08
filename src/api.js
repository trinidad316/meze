import { API_URL } from "./constants";

function systemPrompt(prefs) {
  const liked    = (prefs.liked    || []).slice(-10).join(", ") || "none yet";
  const disliked = (prefs.disliked || []).slice(-10).join(", ") || "none yet";
  return `Mediterranean meal planning for someone with Sjögren's syndrome. All food must be moist/tender/easy to swallow. No dry textures. Anti-inflammatory, high protein, gentle GI. Low spice. Bold flavors: lemon, garlic, olive oil, herbs, capers, olives. Solo portions. Proteins: chicken, salmon, eggs, turkey, legumes.
USER LIKED: ${liked}
USER DISLIKED: ${disliked} — avoid similar
Return ONLY valid JSON, no markdown.`;
}

export async function fetchOptions(prefs, slotLabel, dayLabel, exclude = []) {
  const excludeNote = exclude.length ? `Exclude: ${exclude.join(", ")}.` : "";
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt(prefs),
      messages: [{
        role: "user",
        content: `Give 3 ${slotLabel} options for ${dayLabel}. ${excludeNote}
Return ONLY a JSON array:
[{"id":"...","name":"...","description":"1 appetizing sentence","key_ingredients":["2-3 fresh items to buy"]},...]`,
      }],
    }),
  });
  const data = await res.json();
  const text  = (data.content || []).map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

export async function fetchRecipe(mealName, slotLabel) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 900,
      system: `Mediterranean meal assistant. Sjögren's: all food moist, tender, easy to swallow. Bold flavors. Return ONLY valid JSON, no markdown.`,
      messages: [{
        role: "user",
        content: `Full recipe for "${mealName}" (${slotLabel}, solo portion).
Return ONLY:
{"prep_time":"...","appliance":"...","ingredients":["..."],"instructions":["..."],"chef_tips":["..."],"sjogrens_note":"..."}`,
      }],
    }),
  });
  const data = await res.json();
  const text  = (data.content || []).map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

export async function fetchShoppingList(selections) {
  const meals = Object.values(selections).filter(Boolean).map(o => o.name).join(", ");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: `Mediterranean meal assistant. Sjögren's diet. Return ONLY valid JSON, no markdown.`,
      messages: [{
        role: "user",
        content: `I'm making these meals this week: ${meals}.
Give me a consolidated shopping list. Exclude pantry staples (olive oil, salt, pepper, dried herbs, vinegar, garlic — assume I have these). Include quantities for solo portions.
Return ONLY:
{"produce":["..."],"protein":["..."],"dairy":["..."],"pantry":["..."]}
Omit empty categories.`,
      }],
    }),
  });
  const data = await res.json();
  const text  = (data.content || []).map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

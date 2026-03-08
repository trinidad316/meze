import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ────────────────────────────────────────────────────────────────

const PREFS_KEY = "med_diet_prefs";
const API_URL   = "http://localhost:3001/api/claude";

const SLOTS = [
  { key: "breakfast",  label: "Breakfast",         color: "#E8935A" },
  { key: "midmorning", label: "Mid-Morning Snack",  color: "#7B9EA6" },
  { key: "lunch",      label: "Lunch",              color: "#6B9E6B" },
  { key: "afternoon",  label: "Afternoon Snack",    color: "#9B8B6E" },
  { key: "dinner",     label: "Dinner",             color: "#C17B5A" },
];

const DAYS = ["Day 1", "Day 2", "Day 3", "Sunday"];

// Empty slot state
function emptySlots() {
  return Object.fromEntries(SLOTS.map(s => [s.key, { options: [], loading: false }]));
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function loadPrefs() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { selections: {}, liked: [], disliked: [] };
  } catch { return { selections: {}, liked: [], disliked: [] }; }
}

async function savePrefs(prefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─── API ──────────────────────────────────────────────────────────────────────

function systemPrompt(prefs) {
  const liked    = (prefs.liked    || []).slice(-10).join(", ") || "none yet";
  const disliked = (prefs.disliked || []).slice(-10).join(", ") || "none yet";
  return `Mediterranean meal planning for someone with Sjögren's syndrome. All food must be moist/tender/easy to swallow. No dry textures. Anti-inflammatory, high protein, gentle GI. Low spice. Bold flavors: lemon, garlic, olive oil, herbs, capers, olives. Solo portions. Proteins: chicken, salmon, eggs, turkey, legumes.
USER LIKED: ${liked}
USER DISLIKED: ${disliked} — avoid similar
Return ONLY valid JSON, no markdown.`;
}

async function fetchOptions(prefs, slotLabel, dayLabel, exclude = []) {
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
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function fetchShoppingList(selections) {
  const meals = Object.values(selections)
    .filter(Boolean)
    .map(o => o.name)
    .join(", ");
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
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function fetchRecipe(mealName, slotLabel) {
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
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── RecipeView ───────────────────────────────────────────────────────────────

function RecipeView({ mealName, slotLabel }) {
  const [recipe,   setRecipe]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function load() {
    if (recipe) { setExpanded(e => !e); return; }
    setLoading(true);
    setExpanded(true);
    try {
      setRecipe(await fetchRecipe(mealName, slotLabel));
    } catch {
      setRecipe({ error: "Couldn't load recipe." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.recipeWrap}>
      <TouchableOpacity onPress={load} style={styles.recipeBtn}>
        {loading
          ? <ActivityIndicator size="small" color="#7B9EA6" />
          : <Text style={styles.recipeBtnText}>{expanded ? "▲ Hide recipe" : "▼ Get recipe"}</Text>
        }
      </TouchableOpacity>

      {expanded && recipe && !recipe.error && (
        <View style={styles.recipeBody}>
          <Text style={styles.recipeMeta}>⏱ {recipe.prep_time}  ·  🍳 {recipe.appliance}</Text>

          <Text style={styles.recipeLabel}>INGREDIENTS</Text>
          {recipe.ingredients?.map((x, i) => <Text key={i} style={styles.recipeItem}>• {x}</Text>)}

          <Text style={styles.recipeLabel}>INSTRUCTIONS</Text>
          {recipe.instructions?.map((x, i) => <Text key={i} style={styles.recipeItem}>{i + 1}. {x}</Text>)}

          {recipe.chef_tips?.length > 0 && <>
            <Text style={styles.recipeLabel}>CHEF TIPS</Text>
            {recipe.chef_tips.map((x, i) => <Text key={i} style={[styles.recipeItem, { color: "#6B9E6B" }]}>• {x}</Text>)}
          </>}

          {recipe.sjogrens_note && (
            <View style={styles.moistureBox}>
              <Text style={styles.recipeLabel}>MOISTURE NOTE</Text>
              <Text style={styles.recipeItem}>{recipe.sjogrens_note}</Text>
            </View>
          )}
        </View>
      )}

      {expanded && recipe?.error && <Text style={styles.recipeError}>{recipe.error}</Text>}
    </View>
  );
}

// ─── MealSlot ─────────────────────────────────────────────────────────────────

function MealSlot({ slot, slotData, selected, onSelect, onUnselect, onLoad, onMore }) {
  const meta    = SLOTS.find(s => s.key === slot);
  const options = slotData?.options || [];
  const loading = slotData?.loading || false;
  const hasOpts = options.length > 0;

  return (
    <View style={styles.slotCard}>
      {/* Header */}
      <View style={[styles.slotHeader, { borderLeftColor: meta.color }]}>
        <Text style={[styles.slotLabel, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
        {selected && (
          <TouchableOpacity onPress={onUnselect}>
            <Text style={styles.clearBtn}>✕ clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty — show Suggest button */}
      {!hasOpts && !loading && (
        <TouchableOpacity style={styles.suggestBtn} onPress={onLoad}>
          <Text style={[styles.suggestBtnText, { color: meta.color }]}>
            + Get suggestions
          </Text>
        </TouchableOpacity>
      )}

      {/* Loading */}
      {loading && !hasOpts && (
        <View style={styles.slotLoading}>
          <ActivityIndicator size="small" color={meta.color} />
        </View>
      )}

      {/* Options */}
      {options.map(opt => {
        const isSelected = selected?.id === opt.id;
        return (
          <View key={opt.id}>
            <TouchableOpacity
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
              onPress={() => isSelected ? onUnselect() : onSelect(opt)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                  {opt.name}
                </Text>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </View>
            </TouchableOpacity>
            {isSelected && <RecipeView mealName={opt.name} slotLabel={meta.label} />}
          </View>
        );
      })}

      {/* More */}
      {hasOpts && (
        <TouchableOpacity style={styles.moreBtn} onPress={onMore} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={meta.color} />
            : <Text style={[styles.moreBtnText, { color: meta.color }]}>+ More options</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ShoppingList ─────────────────────────────────────────────────────────────

const SHOP_CATEGORIES = [
  { key: "produce", label: "PRODUCE",  color: "#4a7a4a" },
  { key: "protein", label: "PROTEIN",  color: "#8a5a3a" },
  { key: "dairy",   label: "DAIRY",    color: "#4a6a8a" },
  { key: "pantry",  label: "PANTRY",   color: "#6a5a3a" },
];

function ShoppingList({ selections }) {
  const [list,     setList]     = useState(null);
  const [listKey,  setListKey]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState(false);

  const currentKey = JSON.stringify(selections);
  const stale = list && listKey !== currentKey;
  const count = Object.values(selections).filter(Boolean).length;
  if (count === 0) return null;

  async function build() {
    if (list && !stale) { setExpanded(e => !e); return; }
    setLoading(true);
    setExpanded(true);
    try {
      setList(await fetchShoppingList(selections));
      setListKey(currentKey);
    } catch {
      setList({ error: "Couldn't build list." });
    } finally {
      setLoading(false);
    }
  }

  const hasItems = list && !list.error && SHOP_CATEGORIES.some(c => list[c.key]?.length);

  return (
    <View style={styles.shoppingCard}>
      <TouchableOpacity onPress={build} style={styles.shoppingBtn} disabled={loading}>
        {loading
          ? <ActivityIndicator size="small" color="#4a7a4a" />
          : <>
              <Text style={styles.shoppingBtnText}>
                {expanded && hasItems ? "▲ Shopping List" : "▼ Build Shopping List"}
              </Text>
              {stale && <Text style={styles.shoppingStale}> · outdated</Text>}
              <Text style={styles.shoppingCount}>{count} meal{count > 1 ? "s" : ""}</Text>
            </>
        }
      </TouchableOpacity>

      {expanded && list?.error && (
        <Text style={styles.shoppingError}>{list.error}</Text>
      )}

      {expanded && hasItems && (
        <View style={styles.shoppingBody}>
          {SHOP_CATEGORIES.filter(c => list[c.key]?.length).map(cat => (
            <View key={cat.key} style={styles.shopCat}>
              <Text style={[styles.shopCatLabel, { color: cat.color }]}>{cat.label}</Text>
              {list[cat.key].map((item, i) => (
                <Text key={i} style={styles.shopItem}>• {item}</Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── SundaySlots ──────────────────────────────────────────────────────────────

function SundaySlots({ sundayData, selections, onSelect, onUnselect, onLoad, onMore }) {
  const [mode, setMode] = useState("extended");
  const key     = `sunday_${mode}`;
  const label   = mode === "extended" ? "Extended Sunday Dinner (~3h)" : "Lighter Sunday Dinner";
  const slotDat = sundayData[mode] || { options: [], loading: false };

  return (
    <View>
      <View style={styles.toggleRow}>
        {["extended", "lighter"].map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
              {m === "extended" ? "Extended (~3h)" : "Lighter"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <MealSlot
        slot="dinner"
        slotData={slotDat}
        selected={selections[key]}
        onSelect={(opt) => onSelect(key, opt)}
        onUnselect={() => onUnselect(key)}
        onLoad={() => onLoad(key, label)}
        onMore={() => onMore(key, label, slotDat.options)}
      />
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function MealPlanner() {
  const [activeDay, setActiveDay] = useState(0);
  const [prefs,     setPrefs]     = useState({ selections: {}, liked: [], disliked: [] });

  // daySlots[0..2][slotKey] = { options, loading }
  const [daySlots, setDaySlots] = useState([emptySlots(), emptySlots(), emptySlots()]);

  // sundayData[extended|lighter] = { options, loading }
  const [sundayData, setSundayData] = useState({
    extended: { options: [], loading: false },
    lighter:  { options: [], loading: false },
  });

  useEffect(() => { loadPrefs().then(setPrefs); }, []);

  // ── Slot loading helpers ──

  function setSlotLoading(dayIdx, slotKey, val) {
    setDaySlots(prev => prev.map((day, i) =>
      i !== dayIdx ? day : { ...day, [slotKey]: { ...day[slotKey], loading: val } }
    ));
  }

  function appendSlotOptions(dayIdx, slotKey, opts) {
    setDaySlots(prev => prev.map((day, i) =>
      i !== dayIdx ? day : {
        ...day,
        [slotKey]: { options: [...day[slotKey].options, ...opts], loading: false }
      }
    ));
  }

  function setSundayLoading(mode, val) {
    setSundayData(prev => ({ ...prev, [mode]: { ...prev[mode], loading: val } }));
  }

  function appendSundayOptions(mode, opts) {
    setSundayData(prev => ({ ...prev, [mode]: { options: [...prev[mode].options, ...opts], loading: false } }));
  }

  // ── Day slot actions ──

  async function handleLoad(dayIdx, slotKey) {
    const slot = SLOTS.find(s => s.key === slotKey);
    setSlotLoading(dayIdx, slotKey, true);
    try {
      const opts = await fetchOptions(prefs, slot.label, DAYS[dayIdx]);
      appendSlotOptions(dayIdx, slotKey, opts);
    } catch {
      setSlotLoading(dayIdx, slotKey, false);
    }
  }

  async function handleMore(dayIdx, slotKey, currentOptions) {
    const slot = SLOTS.find(s => s.key === slotKey);
    setSlotLoading(dayIdx, slotKey, true);
    try {
      const opts = await fetchOptions(prefs, slot.label, DAYS[dayIdx], currentOptions.map(o => o.name));
      appendSlotOptions(dayIdx, slotKey, opts);
    } catch {
      setSlotLoading(dayIdx, slotKey, false);
    }
  }

  async function handleSelect(dayIdx, slotKey, opt) {
    const selKey  = `day${dayIdx}_${slotKey}`;
    const updated = { ...prefs, selections: { ...prefs.selections, [selKey]: opt } };
    updated.liked = [...new Set([...updated.liked, opt.name])];
    setPrefs(updated);
    await savePrefs(updated);
  }

  async function handleUnselect(dayIdx, slotKey) {
    const selKey  = `day${dayIdx}_${slotKey}`;
    const updated = { ...prefs, selections: { ...prefs.selections } };
    delete updated.selections[selKey];
    setPrefs(updated);
    await savePrefs(updated);
  }

  // ── Sunday actions ──

  async function handleSundayLoad(key, label) {
    const mode = key.replace("sunday_", "");
    setSundayLoading(mode, true);
    try {
      const opts = await fetchOptions(prefs, label, "Sunday");
      appendSundayOptions(mode, opts);
    } catch {
      setSundayLoading(mode, false);
    }
  }

  async function handleSundayMore(key, label, currentOptions) {
    const mode = key.replace("sunday_", "");
    setSundayLoading(mode, true);
    try {
      const opts = await fetchOptions(prefs, label, "Sunday", currentOptions.map(o => o.name));
      appendSundayOptions(mode, opts);
    } catch {
      setSundayLoading(mode, false);
    }
  }

  async function handleSundaySelect(key, opt) {
    const updated = { ...prefs, selections: { ...prefs.selections, [key]: opt } };
    updated.liked = [...new Set([...updated.liked, opt.name])];
    setPrefs(updated);
    await savePrefs(updated);
  }

  async function handleSundayUnselect(key) {
    const updated = { ...prefs, selections: { ...prefs.selections } };
    delete updated.selections[key];
    setPrefs(updated);
    await savePrefs(updated);
  }

  const isSunday = activeDay === 3;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mediterranean</Text>
          <Text style={styles.headerSub}>Meal Planner</Text>
        </View>

        {/* Day tabs */}
        <View style={styles.tabs}>
          {DAYS.map((label, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.tab, activeDay === i && styles.tabActive]}
              onPress={() => setActiveDay(i)}
            >
              <Text style={[styles.tabText, activeDay === i && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ShoppingList selections={prefs.selections} />

        {isSunday ? (
          <SundaySlots
            sundayData={sundayData}
            selections={prefs.selections}
            onSelect={handleSundaySelect}
            onUnselect={handleSundayUnselect}
            onLoad={handleSundayLoad}
            onMore={handleSundayMore}
          />
        ) : (
          SLOTS.map(slot => {
            const selKey  = `day${activeDay}_${slot.key}`;
            return (
              <MealSlot
                key={slot.key}
                slot={slot.key}
                dayLabel={DAYS[activeDay]}
                slotData={daySlots[activeDay][slot.key]}
                selected={prefs.selections[selKey]}
                onSelect={(opt) => handleSelect(activeDay, slot.key, opt)}
                onUnselect={() => handleUnselect(activeDay, slot.key)}
                onLoad={() => handleLoad(activeDay, slot.key)}
                onMore={() => handleMore(activeDay, slot.key, daySlots[activeDay][slot.key].options)}
              />
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  bg: "#f7f3ee", card: "#ffffff", border: "#e0d5c8",
  terracotta: "#C17B5A",
  textPrimary: "#2c1f0a", textSecondary: "#6b5a3e", textMuted: "#aaa099",
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 48 },

  header:      { alignItems: "center", marginBottom: 20, marginTop: 8 },
  headerTitle: { fontSize: 30, fontWeight: "700", color: C.textPrimary, letterSpacing: 1 },
  headerSub:   { fontSize: 12, color: C.textMuted, letterSpacing: 4, textTransform: "uppercase", marginTop: 2 },

  tabs:          { flexDirection: "row", marginBottom: 16, gap: 6 },
  tab:           { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  tabActive:     { backgroundColor: C.terracotta, borderColor: C.terracotta },
  tabText:       { color: C.textMuted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  slotCard:   { backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: "hidden" },
  slotHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderLeftWidth: 3, backgroundColor: "#faf6f1" },
  slotLabel:  { fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  clearBtn:   { fontSize: 11, color: C.textMuted },

  suggestBtn:     { paddingVertical: 14, alignItems: "center" },
  suggestBtnText: { fontSize: 13, fontWeight: "600" },
  slotLoading:    { paddingVertical: 16, alignItems: "center" },

  optionRow:         { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 12 },
  optionRowSelected: { backgroundColor: "#f0f7f0" },
  checkbox:          { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.textMuted, alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 },
  checkboxChecked:   { backgroundColor: "#6B9E6B", borderColor: "#6B9E6B" },
  checkmark:         { color: "#fff", fontSize: 13, fontWeight: "700" },
  optionText:         { flex: 1 },
  optionName:         { fontSize: 15, fontWeight: "600", color: C.textPrimary, marginBottom: 3 },
  optionNameSelected: { color: "#3d7a3d" },
  optionDesc:         { fontSize: 13, color: C.textSecondary, lineHeight: 18 },

  moreBtn:     { paddingHorizontal: 14, paddingVertical: 12, alignItems: "center", borderTopWidth: 1, borderTopColor: C.border },
  moreBtnText: { fontSize: 13, fontWeight: "600" },

  recipeWrap:    { backgroundColor: "#f5faf5", borderTopWidth: 1, borderTopColor: C.border },
  recipeBtn:     { paddingHorizontal: 14, paddingVertical: 10, alignItems: "center" },
  recipeBtnText: { fontSize: 12, color: "#5a8a96", fontWeight: "600" },
  recipeBody:    { paddingHorizontal: 14, paddingBottom: 14 },
  recipeMeta:    { fontSize: 12, color: C.textMuted, marginBottom: 10 },
  recipeLabel:   { fontSize: 9, fontWeight: "700", letterSpacing: 2, color: C.textMuted, marginTop: 10, marginBottom: 4 },
  recipeItem:    { fontSize: 13, color: C.textSecondary, lineHeight: 20, marginBottom: 2 },
  moistureBox:   { backgroundColor: "#edf4f7", borderLeftWidth: 2, borderLeftColor: "#7B9EA6", borderRadius: 4, padding: 8, marginTop: 10 },
  recipeError:   { fontSize: 13, color: "#cc3333", padding: 12, textAlign: "center" },

  shoppingCard:    { backgroundColor: "#f0f7f0", borderRadius: 8, borderWidth: 1, borderColor: "#c8dfc8", marginBottom: 14, overflow: "hidden" },
  shoppingBtn:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  shoppingBtnText: { fontSize: 13, fontWeight: "600", color: "#4a7a4a", flex: 1 },
  shoppingStale:   { fontSize: 12, color: "#a07040" },
  shoppingCount:   { fontSize: 11, color: C.textMuted },
  shoppingBody:    { paddingHorizontal: 14, paddingBottom: 14 },
  shoppingError:   { fontSize: 13, color: "#cc3333", padding: 12, textAlign: "center" },
  shopCat:         { marginTop: 10 },
  shopCatLabel:    { fontSize: 9, fontWeight: "700", letterSpacing: 2, marginBottom: 4 },
  shopItem:        { fontSize: 13, color: C.textSecondary, lineHeight: 20 },

  toggleRow:        { flexDirection: "row", gap: 8, marginBottom: 12 },
  toggleBtn:        { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  toggleBtnActive:  { backgroundColor: "#E8935A", borderColor: "#E8935A" },
  toggleText:       { color: C.textMuted, fontSize: 13, fontWeight: "600" },
  toggleTextActive: { color: "#fff" },
});

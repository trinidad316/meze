import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SLOTS, DAYS, emptySlots } from "../src/constants";
import { loadPrefs, savePrefs } from "../src/storage";
import { fetchOptions, fetchMealHistory, logMealSelection, rateMeal } from "../src/api";
import { MealSlot } from "../src/components/MealSlot";
import { ShoppingList } from "../src/components/ShoppingList";
import { SundaySlots } from "../src/components/SundaySlots";
import { styles } from "../src/styles";

export default function MealPlanner() {
  const [activeDay, setActiveDay] = useState(0);
  const [prefs,     setPrefs]     = useState({ selections: {}, favorites: [], liked: [], disliked: [] });
  const [daySlots,  setDaySlots]  = useState([emptySlots(), emptySlots(), emptySlots()]);
  const [sundayData,setSundayData]= useState({
    extended: { options: [], loading: false },
    lighter:  { options: [], loading: false },
  });
  const [ratings, setRatings] = useState({}); // { [mealName]: 1-5 }

  useEffect(() => {
    Promise.all([loadPrefs(), fetchMealHistory()]).then(([saved, db]) => {
      setPrefs({ ...saved, favorites: db.favorites, liked: db.liked, disliked: db.disliked });
      setRatings(db.ratings || {});
    });
  }, []);

  // ── Slot helpers ──

  function setSlotLoading(dayIdx, slotKey, val) {
    setDaySlots(prev => prev.map((day, i) =>
      i !== dayIdx ? day : { ...day, [slotKey]: { ...day[slotKey], loading: val } }
    ));
  }

  function appendSlotOptions(dayIdx, slotKey, opts) {
    setDaySlots(prev => prev.map((day, i) =>
      i !== dayIdx ? day : { ...day, [slotKey]: { options: [...day[slotKey].options, ...opts], loading: false } }
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
      appendSlotOptions(dayIdx, slotKey, await fetchOptions(prefs, slot.label, DAYS[dayIdx]));
    } catch { setSlotLoading(dayIdx, slotKey, false); }
  }

  async function handleMore(dayIdx, slotKey, currentOptions) {
    const slot = SLOTS.find(s => s.key === slotKey);
    setSlotLoading(dayIdx, slotKey, true);
    try {
      appendSlotOptions(dayIdx, slotKey, await fetchOptions(prefs, slot.label, DAYS[dayIdx], currentOptions.map(o => o.name)));
    } catch { setSlotLoading(dayIdx, slotKey, false); }
  }

  async function handleSelect(dayIdx, slotKey, opt) {
    const selKey  = `day${dayIdx}_${slotKey}`;
    const updated = { ...prefs, selections: { ...prefs.selections, [selKey]: opt } };
    setPrefs(updated);
    await savePrefs(updated);
    logMealSelection(opt, slotKey, DAYS[dayIdx]);
  }

  async function handleUnselect(dayIdx, slotKey) {
    const selKey  = `day${dayIdx}_${slotKey}`;
    const updated = { ...prefs, selections: { ...prefs.selections } };
    delete updated.selections[selKey];
    setPrefs(updated);
    await savePrefs(updated);
  }

  async function handleRate(name, stars) {
    // toggle off if tapping same star again
    const next = ratings[name] === stars ? 0 : stars;
    setRatings(r => ({ ...r, [name]: next || undefined }));
    rateMeal(name, next);
    // keep prefs liked/disliked in sync for session prompts
    const updated = { ...prefs };
    updated.favorites = (updated.favorites || []).filter(n => n !== name);
    updated.liked     = updated.liked.filter(n => n !== name);
    updated.disliked  = updated.disliked.filter(n => n !== name);
    if (next === 5) updated.favorites = [...updated.favorites, name];
    if (next === 4) updated.liked     = [...updated.liked, name];
    if (next <= 2 && next > 0) updated.disliked = [...updated.disliked, name];
    setPrefs(updated);
    await savePrefs(updated);
  }

  // ── Sunday actions ──

  async function handleSundayLoad(key, label) {
    const mode = key.replace("sunday_", "");
    setSundayLoading(mode, true);
    try {
      appendSundayOptions(mode, await fetchOptions(prefs, label, "Sunday"));
    } catch { setSundayLoading(mode, false); }
  }

  async function handleSundayMore(key, label, currentOptions) {
    const mode = key.replace("sunday_", "");
    setSundayLoading(mode, true);
    try {
      appendSundayOptions(mode, await fetchOptions(prefs, label, "Sunday", currentOptions.map(o => o.name)));
    } catch { setSundayLoading(mode, false); }
  }

  async function handleSundaySelect(key, opt) {
    const updated = { ...prefs, selections: { ...prefs.selections, [key]: opt } };
    setPrefs(updated);
    await savePrefs(updated);
    logMealSelection(opt, key, "Sunday");
  }

  async function handleSundayUnselect(key) {
    const updated = { ...prefs, selections: { ...prefs.selections } };
    delete updated.selections[key];
    setPrefs(updated);
    await savePrefs(updated);
  }

  async function handleReset() {
    const updated = { ...prefs, selections: {} };
    setPrefs(updated);
    setDaySlots([emptySlots(), emptySlots(), emptySlots()]);
    setSundayData({ extended: { options: [], loading: false }, lighter: { options: [], loading: false } });
    await savePrefs(updated);
  }

  const isSunday = activeDay === 3;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meze</Text>
          <Text style={styles.headerSub}>Meal Planner</Text>
          {Object.keys(prefs.selections).length > 0 && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Reset Week</Text>
            </TouchableOpacity>
          )}
        </View>

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
            ratings={ratings}
            onSelect={handleSundaySelect}
            onUnselect={handleSundayUnselect}
            onLoad={handleSundayLoad}
            onMore={handleSundayMore}
            onRate={handleRate}
          />
        ) : (
          SLOTS.map(slot => {
            const selKey = `day${activeDay}_${slot.key}`;
            return (
              <MealSlot
                key={slot.key}
                slot={slot.key}
                slotData={daySlots[activeDay][slot.key]}
                selected={prefs.selections[selKey]}
                ratings={ratings}
                onSelect={(opt) => handleSelect(activeDay, slot.key, opt)}
                onUnselect={() => handleUnselect(activeDay, slot.key)}
                onRate={handleRate}
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

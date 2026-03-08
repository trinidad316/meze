import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREFS_KEY } from "./constants";

export async function loadPrefs() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { selections: {}, liked: [], disliked: [] };
  } catch { return { selections: {}, liked: [], disliked: [] }; }
}

export async function savePrefs(prefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

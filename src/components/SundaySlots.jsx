import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../styles";
import { MealSlot } from "./MealSlot";

export function SundaySlots({ sundayData, selections, ratings, onSelect, onUnselect, onLoad, onMore, onRate }) {
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
        ratings={ratings}
        onSelect={(opt) => onSelect(key, opt)}
        onUnselect={() => onUnselect(key)}
        onLoad={() => onLoad(key, label)}
        onMore={() => onMore(key, label, slotDat.options)}
        onRate={onRate}
      />
    </View>
  );
}

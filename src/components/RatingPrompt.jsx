import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { submitPostRating } from "../api";
import { styles, C } from "../styles";

export function RatingPrompt({ pending, onDone }) {
  const [idx, setIdx] = useState(0);

  if (!pending?.length || idx >= pending.length) return null;

  const meal = pending[idx];

  async function respond(rating) {
    await submitPostRating(meal.id, meal.name, rating);
    if (idx + 1 >= pending.length) {
      onDone();
    } else {
      setIdx(i => i + 1);
    }
  }

  const slotLabel = meal.slot
    ? meal.slot.charAt(0).toUpperCase() + meal.slot.slice(1).replace(/([A-Z])/g, " $1")
    : "";

  return (
    <View style={styles.ratingPrompt}>
      <Text style={styles.ratingPromptEyebrow}>HOW WAS IT?</Text>
      <Text style={styles.ratingPromptName}>{meal.name}</Text>
      {slotLabel ? <Text style={styles.ratingPromptMeta}>{slotLabel} · {meal.day}</Text> : null}
      <View style={styles.ratingPromptBtns}>
        <TouchableOpacity style={[styles.ratingBtn, styles.ratingBtnLike]} onPress={() => respond(1)}>
          <Text style={styles.ratingBtnText}>👍  Loved it</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ratingBtn, styles.ratingBtnDislike]} onPress={() => respond(-1)}>
          <Text style={styles.ratingBtnText}>👎  Not for me</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ratingBtnSkip} onPress={() => respond(0)}>
          <Text style={styles.ratingBtnSkipText}>skip →</Text>
        </TouchableOpacity>
      </View>
      {pending.length > 1 && (
        <Text style={styles.ratingPromptCounter}>{idx + 1} of {pending.length}</Text>
      )}
    </View>
  );
}

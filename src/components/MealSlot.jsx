import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SLOTS } from "../constants";
import { styles } from "../styles";
import { RecipeView } from "./RecipeView";

function StarRating({ name, rating, onRate }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onRate(name, n)} hitSlop={6}>
          <Text style={[styles.star, rating >= n && styles.starFilled]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function MealSlot({ slot, slotData, selected, ratings, onSelect, onUnselect, onRate, onLoad, onMore }) {
  const meta    = SLOTS.find(s => s.key === slot);
  const options = slotData?.options || [];
  const loading = slotData?.loading || false;
  const hasOpts = options.length > 0;

  return (
    <View style={styles.slotCard}>
      <View style={[styles.slotHeader, { borderLeftColor: meta.color }]}>
        <Text style={[styles.slotLabel, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
        {selected && (
          <TouchableOpacity onPress={onUnselect}>
            <Text style={styles.clearBtn}>✕ clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasOpts && !loading && (
        <TouchableOpacity style={styles.suggestBtn} onPress={onLoad}>
          <Text style={[styles.suggestBtnText, { color: meta.color }]}>+ Get suggestions</Text>
        </TouchableOpacity>
      )}

      {loading && !hasOpts && (
        <View style={styles.slotLoading}>
          <ActivityIndicator size="small" color={meta.color} />
        </View>
      )}

      {options.map(opt => {
        const isSelected = selected?.id === opt.id;
        const starRating = ratings?.[opt.name];
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
                <StarRating name={opt.name} rating={starRating} onRate={onRate} />
              </View>
            </TouchableOpacity>
            {isSelected && <RecipeView mealName={opt.name} slotLabel={meta.label} />}
          </View>
        );
      })}

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

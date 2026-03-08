import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { fetchRecipe } from "../api";
import { styles } from "../styles";

export function RecipeView({ mealName, slotLabel }) {
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

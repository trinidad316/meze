import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { fetchShoppingList } from "../api";
import { styles } from "../styles";

const SHOP_CATEGORIES = [
  { key: "produce", label: "PRODUCE", color: "#4a7a4a" },
  { key: "protein", label: "PROTEIN", color: "#8a5a3a" },
  { key: "dairy",   label: "DAIRY",   color: "#4a6a8a" },
  { key: "pantry",  label: "PANTRY",  color: "#6a5a3a" },
];

export function ShoppingList({ selections }) {
  const [list,    setList]    = useState(null);
  const [listKey, setListKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded,setExpanded]= useState(false);

  const currentKey = useMemo(() => JSON.stringify(selections), [selections]);
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
              <View style={styles.shoppingMeta}>
                {stale && <Text style={styles.shoppingStale}>outdated</Text>}
                <Text style={styles.shoppingCount}>{count} meal{count > 1 ? "s" : ""}</Text>
              </View>
            </>
        }
      </TouchableOpacity>

      {expanded && list?.error && <Text style={styles.shoppingError}>{list.error}</Text>}

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

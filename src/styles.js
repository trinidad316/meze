import { StyleSheet } from "react-native";

export const C = {
  bg: "#f7f3ee", card: "#ffffff", border: "#e0d5c8",
  terracotta: "#C17B5A",
  textPrimary: "#2c1f0a", textSecondary: "#6b5a3e", textMuted: "#aaa099",
};

export const styles = StyleSheet.create({
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
  optionText:        { flex: 1 },
  optionName:        { fontSize: 15, fontWeight: "600", color: C.textPrimary, marginBottom: 3 },
  optionNameSelected:{ color: "#3d7a3d" },
  optionDesc:        { fontSize: 13, color: C.textSecondary, lineHeight: 18 },

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

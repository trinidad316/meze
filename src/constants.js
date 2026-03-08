export const PREFS_KEY = "med_diet_prefs";
export const API_URL   = "http://localhost:3001/api/claude";

export const SLOTS = [
  { key: "breakfast",  label: "Breakfast",        color: "#E8935A" },
  { key: "midmorning", label: "Mid-Morning Snack", color: "#7B9EA6" },
  { key: "lunch",      label: "Lunch",             color: "#6B9E6B" },
  { key: "afternoon",  label: "Afternoon Snack",   color: "#9B8B6E" },
  { key: "dinner",     label: "Dinner",            color: "#C17B5A" },
];

export const DAYS = ["Day 1", "Day 2", "Day 3", "Sunday"];

export function emptySlots() {
  return Object.fromEntries(SLOTS.map(s => [s.key, { options: [], loading: false }]));
}

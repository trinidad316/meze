import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { config } from "dotenv";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";

config();

// ── DB setup ──
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
if (!existsSync(dataDir)) mkdirSync(dataDir);
const db = new Database(join(dataDir, "meze.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS meal_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    slot        TEXT,
    day         TEXT,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meal_ratings (
    name     TEXT PRIMARY KEY,
    rating   INTEGER NOT NULL,
    rated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertHistory = db.prepare(
  `INSERT INTO meal_history (name, description, slot, day) VALUES (@name, @description, @slot, @day)`
);
const upsertRating  = db.prepare(
  `INSERT INTO meal_ratings (name, rating) VALUES (@name, @rating)
   ON CONFLICT(name) DO UPDATE SET rating=excluded.rating, rated_at=CURRENT_TIMESTAMP`
);
const deleteRating  = db.prepare(`DELETE FROM meal_ratings WHERE name = @name`);
const getAllRatings  = db.prepare(`SELECT name, rating FROM meal_ratings`);
const getFavorites  = db.prepare(`SELECT name FROM meal_ratings WHERE rating = 5  ORDER BY rated_at DESC LIMIT 10`);
const getLiked      = db.prepare(`SELECT name FROM meal_ratings WHERE rating = 4  ORDER BY rated_at DESC LIMIT 20`);
const getDisliked   = db.prepare(`SELECT name FROM meal_ratings WHERE rating <= 2 ORDER BY rated_at DESC LIMIT 20`);
const getHistory    = db.prepare(
  `SELECT h.name, h.description, h.slot, h.day, h.selected_at, r.rating
   FROM meal_history h
   LEFT JOIN meal_ratings r ON r.name = h.name
   ORDER BY h.selected_at DESC LIMIT 200`
);

// ── Express ──
const app = express();
app.use(cors());
app.use(express.json());

// Anthropic proxy
app.post("/api/claude", async (req, res) => {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Log a meal selection
app.post("/api/meals/select", (req, res) => {
  const { name, description, slot, day } = req.body;
  insertHistory.run({ name, description: description || "", slot: slot || "", day: day || "" });
  res.json({ ok: true });
});

// Rate a meal: rating = 1 | 2 | 3 stars, or 0 to remove
app.post("/api/meals/rate", (req, res) => {
  const { name, rating } = req.body;
  if (rating === 0) {
    deleteRating.run({ name });
  } else {
    upsertRating.run({ name, rating });
  }
  res.json({ ok: true });
});

// All ratings as { name: stars } map + liked/disliked for prompts
app.get("/api/meals/ratings", (req, res) => {
  const map = {};
  getAllRatings.all().forEach(r => { map[r.name] = r.rating; });
  res.json(map);
});

// History + liked/disliked + ratings map for seeding the app on load
app.get("/api/meals/history", (req, res) => {
  const ratingsMap = {};
  getAllRatings.all().forEach(r => { ratingsMap[r.name] = r.rating; });
  res.json({
    history:   getHistory.all(),
    favorites: getFavorites.all().map(r => r.name),
    liked:     getLiked.all().map(r => r.name),
    disliked:  getDisliked.all().map(r => r.name),
    ratings:   ratingsMap,
  });
});

app.listen(3001, () => console.log("API proxy + DB running on http://localhost:3001"));

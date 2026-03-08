import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { config } from "dotenv";

config();

const app = express();
app.use(cors());
app.use(express.json());

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
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, () => console.log("API proxy running on http://localhost:3001"));

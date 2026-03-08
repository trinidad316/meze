const { app, BrowserWindow, shell } = require("electron");
const http = require("http");
const fs   = require("fs");
const path = require("path");

const WIDTH  = 390;
const HEIGHT = 844;

// ─── Load .env (packaged mode reads from resourcesPath) ───────────────────────

function loadEnv() {
  const envPath = app.isPackaged
    ? path.join(process.resourcesPath, ".env")
    : path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
}

// ─── Inline proxy server on :3001 (packaged mode only) ────────────────────────

function startProxy() {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    if (req.method === "POST" && req.url === "/api/claude") {
      let body = "";
      req.on("data", c => body += c);
      req.on("end", async () => {
        try {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body,
          });
          const data = await r.json();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data));
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } else {
      res.writeHead(404); res.end();
    }
  });
  server.listen(3001);
}

// ─── Static file server on :8081 (packaged mode only) ────────────────────────

const MIME = {
  ".html": "text/html", ".js": "application/javascript",
  ".css": "text/css",   ".json": "application/json",
  ".png": "image/png",  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".ttf": "font/ttf",   ".woff": "font/woff", ".woff2": "font/woff2",
};

function startStaticServer() {
  const distDir = path.join(process.resourcesPath, "dist");
  const server  = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url.split("?")[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, "index.html");
    }
    fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(content);
    });
  });
  server.listen(8081);
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width:  WIDTH,
    height: HEIGHT,
    resizable: false,
    titleBarStyle: "hiddenInset",
    title: "gen-health",
    backgroundColor: "#f7f3ee",
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  function tryLoad() {
    win.loadURL("http://localhost:8081").catch(() => setTimeout(tryLoad, 1000));
  }
  tryLoad();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

loadEnv();

if (app.isPackaged) {
  startProxy();
  startStaticServer();
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

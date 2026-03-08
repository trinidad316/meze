// Waits 5s for Expo to start, then launches Electron
const { spawn } = require("child_process");
const electron  = require("electron");

setTimeout(() => {
  spawn(electron, ["electron/main.js"], { stdio: "inherit" });
}, 5000);

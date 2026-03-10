#!/bin/bash
cd "$(dirname "$0")/.."

# Start proxy in background
node server/index.mjs &
PROXY_PID=$!

# Start Expo in background
pnpm start &
EXPO_PID=$!

# Wait for Expo, then launch Electron
node electron/launch.js

# Cleanup on exit
kill $PROXY_PID $EXPO_PID 2>/dev/null

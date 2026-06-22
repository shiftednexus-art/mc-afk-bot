/**
 * config.js
 * All settings are read from environment variables so you can set them
 * in Render's dashboard without touching code.
 *
 * ── How to set on Render ──────────────────────────────────────────────────────
 *  Dashboard → your service → Environment → Add Environment Variable
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

module.exports = {
  // ── Server connection ────────────────────────────────────────────────────────
  host:     process.env.MC_HOST || 'your.server.ip',   // ← CHANGE THIS
  port:     parseInt(process.env.MC_PORT || '25565', 10),
  username: process.env.MC_USER || 'AFKBot',            // ← CHANGE THIS
  password: process.env.MC_PASS || '',                  // blank = offline/cracked
  version:  process.env.MC_VER  || '1.21.1',            // must match Paper version
  auth:     process.env.MC_AUTH || 'offline',            // 'offline' for cracked

  // ── Timing (ms) ─────────────────────────────────────────────────────────────
  lobbyWaitMs:    parseInt(process.env.LOBBY_WAIT_MS    || '5000',  10),  // wait after spawn
  actionDelayMs:  parseInt(process.env.ACTION_DELAY_MS  || '1500',  10),  // between actions
  idleIntervalMs: parseInt(process.env.IDLE_INTERVAL_MS || '25000', 10),  // anti-AFK interval

  // ── Gamemode selector ────────────────────────────────────────────────────────
  // Hotbar slot with the compass: slot 5 in-game = index 4 (0-based)
  compassSlot: parseInt(process.env.COMPASS_SLOT || '4', 10),

  // Chest GUI slot to click (0-based, counting from top-left of chest)
  //  Row 0 = slots 0-8 | Row 1 = slots 9-17 | Row 2 = slots 18-26
  //  Slot 21 = 4th item in row 2
  guiSlot: parseInt(process.env.GUI_SLOT || '21', 10),

  // ── Reconnect ────────────────────────────────────────────────────────────────
  maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT   || '50',     10),
  reconnectBaseMs:      parseInt(process.env.RECONNECT_BASE  || '5000',   10),
  reconnectMaxMs:       parseInt(process.env.RECONNECT_MAX   || '120000', 10),
};

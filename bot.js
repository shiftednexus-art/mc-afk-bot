require('./web');
/**
 * Minecraft AFK Gamemode Bot
 * Target: Java Edition 1.21.x (Paper + Velocity, offline/cracked mode)
 * Deployment: Render.com Background Worker
 *
 * Flow:
 *  1. Connect to server
 *  2. Wait for lobby to load
 *  3. Select hotbar slot 5 (compass / gamemode selector)
 *  4. Right-click to open the GUI
 *  5. Click chest slot 21 (target gamemode item)
 *  6. Stay connected & idle (anti-AFK movement)
 *  7. Auto-reconnect on disconnect (exponential back-off)
 */

'use strict';

const mineflayer = require('mineflayer');
const config     = require('./config');
const logger     = require('./logger');

// ─── Reconnect state ──────────────────────────────────────────────────────────
let reconnectAttempts = 0;
let bot               = null;
let idleTimer         = null;
let flowDone          = false;

// ─── Bot factory ──────────────────────────────────────────────────────────────
function createBot() {
  flowDone = false;
  logger.info(`Connecting to ${config.host}:${config.port} as "${config.username}" [attempt ${reconnectAttempts + 1}]`);

  bot = mineflayer.createBot({
    host:                 config.host,
    port:                 config.port,
    username:             config.username,
    password:             config.password || undefined,
    version:              config.version,
    auth:                 config.auth,
    hideErrors:           false,
    checkTimeoutInterval: 30_000,
  });

  bot.once('spawn',      onSpawn);
  bot.on  ('windowOpen', onWindowOpen);
  bot.on  ('chat',       onChat);
  bot.on  ('kicked',     onKicked);
  bot.on  ('error',      onError);
  bot.once('end',        onEnd);
}

// ─── Spawn ────────────────────────────────────────────────────────────────────
function onSpawn() {
  reconnectAttempts = 0;
  logger.info(`Spawned at ${fmt(bot.entity.position)} — waiting ${config.lobbyWaitMs}ms for lobby …`);
  setTimeout(startFlow, config.lobbyWaitMs);
}

// ─── Main flow ────────────────────────────────────────────────────────────────
async function startFlow() {
  if (flowDone) return;
  try {
    logger.info('▶ Step 1 – selecting hotbar slot ' + (config.compassSlot + 1));
    await switchHotbarSlot(config.compassSlot);
    await sleep(config.actionDelayMs);

    logger.info('▶ Step 2 – right-clicking compass to open GUI …');
    await bot.activateItem();
    // onWindowOpen takes over from here

  } catch (err) {
    logger.error('Flow error: ' + err.message);
    // Retry the flow once after a delay
    setTimeout(startFlow, 5000);
  }
}

// ─── GUI click ────────────────────────────────────────────────────────────────
async function onWindowOpen(window) {
  if (flowDone) return;

  const title = typeof window.title === 'object'
    ? JSON.stringify(window.title)
    : String(window.title);

  logger.info(`Window opened: "${title}" — ${window.slots.length} slots`);
  await sleep(config.actionDelayMs);

  try {
    const targetSlot = window.slots[config.guiSlot];

    if (!targetSlot || targetSlot.type === -1) {
      logger.warn(`Slot ${config.guiSlot} is empty. Non-empty slots:`);
      window.slots.forEach((s, i) => {
        if (s && s.type !== -1)
          logger.info(`  [${String(i).padStart(2,'0')}] ${s.name} ×${s.count}`);
      });
      bot.closeWindow(window);
      return;
    }

    logger.info(`▶ Step 3 – clicking slot ${config.guiSlot}: ${targetSlot.name} ×${targetSlot.count}`);
    await bot.clickWindow(config.guiSlot, 0, 0);
    flowDone = true;
    logger.info('✔ Gamemode selected – entering AFK mode');

    await sleep(600);
    try { bot.closeWindow(window); } catch (_) {}

    startAntiAfk();

  } catch (err) {
    logger.error('GUI click error: ' + err.message);
  }
}

// ─── Anti-AFK movement ───────────────────────────────────────────────────────
function startAntiAfk() {
  if (idleTimer) return;
  logger.info(`Anti-AFK active — moving every ${config.idleIntervalMs / 1000}s`);

  idleTimer = setInterval(async () => {
    if (!bot || !bot.entity) return;
    try {
      // Tiny look-rotation ping-pong so the server sees activity
      const yaw = bot.entity.yaw + (Math.random() * 0.02 - 0.01);
      bot.look(yaw, bot.entity.pitch, false);
    } catch (_) {}
  }, config.idleIntervalMs);
}

function stopAntiAfk() {
  if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
}

// ─── Chat listener (login plugin support) ────────────────────────────────────
function onChat(username, message) {
  const msg = String(message).toLowerCase();

  if (
    msg.includes('/register') ||
    msg.includes('register using') ||
    msg.includes('please register')
  ) {
    if (config.password) {
      bot.chat(`/register ${config.password} ${config.password}`);
      logger.info('Sent register command');
    }
  }

  if (
    msg.includes('/login') ||
    msg.includes('please login') ||
    msg.includes('log in using')
  ) {
    if (config.password) {
      bot.chat(`/login ${config.password}`);
      logger.info('Sent login command');
    }
  }

  logger.debug(`[CHAT] <${username}> ${message}`);
}
// ─── Disconnect handlers ──────────────────────────────────────────────────────
function onKicked(reason) {
  logger.warn('Kicked: ' + (typeof reason === 'object' ? JSON.stringify(reason) : reason));
}

function onError(err) {
  logger.error('Bot error: ' + err.message);
}

function onEnd(reason) {
  stopAntiAfk();
  logger.warn(`Disconnected (${reason}) — scheduling reconnect …`);
  scheduleReconnect();
}

function scheduleReconnect() {
  if (reconnectAttempts >= config.maxReconnectAttempts) {
    logger.error(`Max reconnects (${config.maxReconnectAttempts}) reached — exiting.`);
    process.exit(1);
  }

  const delay = Math.min(
    config.reconnectBaseMs * Math.pow(2, reconnectAttempts),
    config.reconnectMaxMs
  );
  reconnectAttempts++;
  logger.info(`Reconnect #${reconnectAttempts} in ${delay / 1000}s …`);
  setTimeout(createBot, delay);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function switchHotbarSlot(slot) {
  return new Promise((resolve, reject) => {
    try { bot.setQuickBarSlot(slot); setTimeout(resolve, 150); }
    catch (e) { reject(e); }
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fmt(pos)  { return pos ? `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})` : '?'; }

// ─── Boot ─────────────────────────────────────────────────────────────────────
process.on('uncaughtException',  e => logger.error('Uncaught: ' + e.message));
process.on('unhandledRejection', e => logger.error('Unhandled: ' + e));

createBot();

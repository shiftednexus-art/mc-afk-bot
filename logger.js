'use strict';

const LEVELS  = { debug: 0, info: 1, warn: 2, error: 3 };
const current = LEVELS[process.env.LOG_LEVEL || 'info'] ?? 1;

function log(level, msg) {
  if (LEVELS[level] < current) return;
  const ts  = new Date().toISOString();
  const tag = level.toUpperCase().padEnd(5);
  console.log(`[${ts}] ${tag} ${msg}`);
}

module.exports = {
  debug: m => log('debug', m),
  info:  m => log('info',  m),
  warn:  m => log('warn',  m),
  error: m => log('error', m),
};

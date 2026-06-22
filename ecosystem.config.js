// PM2 ecosystem config — run with: pm2 start ecosystem.config.js
// Install PM2 globally first: npm install -g pm2

module.exports = {
  apps: [
    {
      name:        'mc-afk-bot',
      script:      'bot.js',
      cwd:         __dirname,
      autorestart: true,          // PM2 restarts the process if it crashes
      watch:       false,
      max_memory_restart: '150M',

      env: {
        NODE_ENV:       'production',
        MC_HOST:        'your.server.ip',
        MC_PORT:        '25565',
        MC_USER:        'AFKBot',
        MC_AUTH:        'offline',
        MC_VER:         '1.21.1',
        COMPASS_SLOT:   '4',      // 0-indexed → in-game slot 5
        GUI_SLOT:       '21',     // chest GUI slot index
        LOBBY_WAIT_MS:  '4000',
        ACTION_DELAY_MS:'1200',
        SEND_IDLE:      'true',
        LOG_LEVEL:      'info',
      },
    },
  ],
};

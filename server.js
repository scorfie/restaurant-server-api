import 'dotenv/config';
import http from 'http';

import app from './src/app.js';
import { checkConnection } from './src/config/db.js';
import { initSocket } from './src/realtime/socket.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await checkConnection();
    console.log('Connected to MySQL database');
  } catch (err) {
    console.error('Failed to connect to MySQL database:', err.message);
    process.exit(1);
  }

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
  });
}

start();

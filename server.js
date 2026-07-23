import 'dotenv/config';

import app from './src/app.js';
import { checkConnection } from './src/config/db.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await checkConnection();
    console.log('Connected to MySQL database');
  } catch (err) {
    console.error('Failed to connect to MySQL database:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

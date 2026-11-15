import 'dotenv/config';

import app from './app.js';
import { connectDatabase } from './config/database.js';

import {
  startScheduler,
  stopScheduler
} from './scheduler/scheduler.js';

const PORT = Number(process.env.PORT || 3000);

let server;
let shuttingDown = false;

async function start() {
  try {
    await connectDatabase();

    server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      startScheduler();
    });
  } catch (error) {
    console.error('Application startup failed:', error);
    process.exit(1);
  }
}

async function shutdown() {
  if (shuttingDown) return;

  shuttingDown = true;
  console.log('Shutting down...');

  stopScheduler();

  if (server) {
    server.close(async () => {
      const mongoose = await import('mongoose');
      await mongoose.default.disconnect();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
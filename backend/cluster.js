#!/usr/bin/env node
// Cluster mode entry point for production.
// Forks one worker per CPU core (capped by CLUSTER_WORKERS env var).
// Each worker runs server.js independently; shared state (matchmaking,
// rooms) is synchronized via Redis when REDIS_URL is set.
//
// Usage:  node cluster.js          (or set CLUSTER=true and run server.js)
// Single: node server.js           (default, no clustering)

const cluster = require('node:cluster');
const os = require('node:os');

const MAX_WORKERS = parseInt(process.env.CLUSTER_WORKERS, 10) || os.cpus().length;
const RESTART_DELAY_MS = 1000;

if (cluster.isPrimary) {
  console.log(`[cluster] Primary ${process.pid} starting ${MAX_WORKERS} workers`);

  for (let i = 0; i < MAX_WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[cluster] Worker ${worker.process.pid} exited (${signal || code})`);
    // Restart crashed workers after a short delay
    setTimeout(() => {
      console.log('[cluster] Replacing worker...');
      cluster.fork();
    }, RESTART_DELAY_MS);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[cluster] Shutting down...');
    for (const id in cluster.workers) {
      cluster.workers[id].send('shutdown');
    }
    setTimeout(() => process.exit(0), 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

} else {
  // Worker: run the existing server
  require('./server');
}

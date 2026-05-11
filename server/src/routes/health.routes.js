import express from 'express';
const router = express.Router();
import os from 'os';

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.cpus().length,
    loadAvg: os.loadavg()
  });
});

router.get('/ready', (req, res) => {
  // Check if database is ready
  res.json({ ready: true });
});

export default router; 
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// ===== MIDDLEWARE - CLEAN VERSION =====
app.use(cors());
app.use(express.json());  // Only once
app.use(express.urlencoded({ extended: true }));

// ===== HEALTH ROUTE =====
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'UrbanNEST API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== TEST ROUTE =====
app.get('/api/v1/info', (req, res) => {
  res.json({
    name: 'UrbanNEST API',
    version: '1.0.0',
    status: 'active'
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export { app, prisma };
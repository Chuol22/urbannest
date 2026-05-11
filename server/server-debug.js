import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Middleware 1: CORS
console.log('1. Adding CORS...');
app.use(cors());

// Middleware 2: JSON parser
console.log('2. Adding JSON parser...');
app.use(express.json());

// Middleware 3: URL encoded
console.log('3. Adding URL encoded...');
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/health', (req, res) => {
  console.log('Health route accessed');
  console.log('req.query type:', typeof req.query);
  res.json({ success: true, message: 'OK' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test: curl http://localhost:${PORT}/health`);
});

export default app;
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import quarteiraoRoutes from './routes/quarteiroes';
import faceRoutes from './routes/faces';
import imovelRoutes from './routes/imoveis';
import localidadeRoutes from './routes/localidades';
import statsRoutes from './routes/stats';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 3333;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quarteiroes', quarteiraoRoutes);
app.use('/api/faces', faceRoutes);
app.use('/api/imoveis', imovelRoutes);
app.use('/api/localidades', localidadeRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Network: http://192.168.0.125:${PORT}`);
  console.log(`📚 API endpoints:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/profile`);
  console.log(`   GET    /api/quarteiroes`);
  console.log(`   POST   /api/quarteiroes`);
  console.log(`   PUT    /api/quarteiroes/:id`);
  console.log(`   DELETE /api/quarteiroes/:id`);
  console.log(`   GET    /api/faces`);
  console.log(`   POST   /api/faces`);
  console.log(`   GET    /api/imoveis`);
  console.log(`   POST   /api/imoveis`);
  console.log(`   GET    /api/localidades`);
  console.log(`   POST   /api/localidades`);
});

export default app;

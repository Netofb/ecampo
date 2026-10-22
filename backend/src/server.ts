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
import syncRoutes from './routes/sync';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || '0.0.0.0';

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
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
app.get('/', (_req, res) => {
  res.status(200).type('html').send(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>eCampo API</title>
        <style>
          body {
            align-items: center;
            background: #d1d4d2;
            color: #183024;
            display: flex;
            font-family: Arial, sans-serif;
            justify-content: center;
            margin: 0;
            min-height: 100vh;
          }
          main {
            background: #cfcfcf;
            border-radius: 12px;
            box-shadow: 0 4px 18px rgba(24, 48, 36, .12);
            max-width: 420px;
            padding: 32px;
            text-align: center;
            width: calc(100% - 64px);
          }
          .status {
            color: #16803c;
            font-size: 1.2rem;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>eCampo API</h1>
          <p class="status">HTTP 200 - OK</p>
          <p>Servidor funcionando normalmente.</p>
        </main>
      </body>
    </html>
  `);
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err);
  res.status(500).type('html').send(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Erro - eCampo API</title>
        <style>
          body {
            align-items: center;
            background: #fff5f5;
            color: #3b1717;
            display: flex;
            font-family: Arial, sans-serif;
            justify-content: center;
            margin: 0;
            min-height: 100vh;
          }
          main {
            background: #fff;
            border: 1px solid #f0b8b8;
            border-radius: 12px;
            box-shadow: 0 4px 18px rgba(96, 24, 24, .12);
            max-width: 520px;
            padding: 32px;
            text-align: center;
            width: calc(100% - 64px);
          }
          .status {
            color: #c62828;
            font-size: 1.2rem;
            font-weight: bold;
          }
          code {
            background: #fff0f0;
            border-radius: 4px;
            display: block;
            margin-top: 16px;
            padding: 12px;
            text-align: left;
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>eCampo API</h1>
          <p class="status">HTTP 500 - Erro interno</p>
          <p>O servidor encontrou um erro. Verifique o terminal para mais detalhes.</p>
          <code>${escapeHtml(String(err?.message || 'Erro desconhecido'))}</code>
        </main>
      </body>
    </html>
  `);
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] || character);
}

// Start server
app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API endpoints:`);
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

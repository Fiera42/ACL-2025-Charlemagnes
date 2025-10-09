// server.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './src/adapters/http/routes/auth';
import calendarRoutes from './src/adapters/http/routes/calendar';
import { connectDatabase, closeDatabase } from './src/infrastructure/database/connection';

dotenv.config();

async function bootstrap() {
  const app = express();
  const PORT: number = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req: Request, res: Response) => res.redirect('/index.html'));
  app.use('/auth', authRoutes);
  app.use('/calendar', calendarRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route non trouvée' });
  });

  // 1) Connexion et init DB AVANT d’écouter
  // await connectDatabase();

  // 2) Démarrage du serveur
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });

  // 3) Arrêt propre
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} reçu, arrêt en cours...`);
    await closeDatabase();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Impossible de démarrer le serveur:', err);
  process.exit(1);
});
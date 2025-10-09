import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { authenticateToken } from './src/adapters/http/middleware/auth';
import authRoutes from './src/adapters/http/routes/auth';
import calendarRoutes from './src/adapters/http/routes/calendar';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req: Request, res: Response) => {
    res.redirect('/index.html');
});

app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);

// Route 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
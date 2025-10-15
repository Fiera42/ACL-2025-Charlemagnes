import { Router } from 'express';
import authRoutes from './auth.js';
import calendarRoutes from './calendar.js';

const router: Router = Router();

// Monter les routes d'authentification
router.use('/auth', authRoutes);

// Monter les routes de calendrier
router.use('/calendar', calendarRoutes);

export default router;

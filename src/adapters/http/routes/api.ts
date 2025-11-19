import { Router } from 'express';
import authRoutes from './auth.js';
import calendarRoutes from './calendar.js';
import tagRoutes from './tag.ts';

const router: Router = Router();

// Monter les routes d'authentification
router.use('/auth', authRoutes);

// Monter les routes de calendrier
router.use('/calendar', calendarRoutes);

// Monter les routes de tags
router.use('/tag', tagRoutes);

export default router;

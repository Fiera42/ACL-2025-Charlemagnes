import express, { Router } from 'express';
import authRoutes from './auth.js';
import calendarRoutes from './calendar.js';
import tagRoutes from './tag.ts';
import pauseRoutes from './pause.js';
import shareRoutes from './share.js';

const router: Router = express.Router();

// Monter les routes d'authentification
router.use('/auth', authRoutes);

// Monter les routes de calendrier
router.use('/calendar', calendarRoutes);

// Monter les routes de tags
router.use('/tag', tagRoutes);

// Monter les routes de partage
router.use('/share', shareRoutes);

// Monter les routes de pauses
router.use('/pause', pauseRoutes);

export default router;
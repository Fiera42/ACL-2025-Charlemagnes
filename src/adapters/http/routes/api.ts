import express, { Router } from 'express';
import authRoutes from './auth.js';
import calendarRoutes from './calendar.js';
import tagRoutes from './tag.js';
import shareRoutes from './share.js';

const router: Router = express.Router();

router.use('/auth', authRoutes);
router.use('/calendar', calendarRoutes);
router.use('/tag', tagRoutes);
router.use('/share', shareRoutes);

export default router;
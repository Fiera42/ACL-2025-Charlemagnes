import express, { Response, Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router: Router = express.Router();

router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.redirect('/index.html');
});

router.get('/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ events: [] });
});

router.post('/events', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Event created' });
});

router.put('/events/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Event updated' });
});

router.delete('/events/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Event deleted' });
});

export default router;

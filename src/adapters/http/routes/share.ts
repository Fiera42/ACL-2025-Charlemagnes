import express, {Response, Router} from 'express';
import {authenticateToken, AuthenticatedRequest} from '../middleware/auth.js';
import {ServiceFactory} from '../../factories/ServiceFactory.js';

const router: Router = express.Router();
const shareService = ServiceFactory.getShareService();

// Partager un calendrier avec un utilisateur
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {calendarId, userShareId} = req.body;
        await shareService.createShareForUser(req.user!.userId, calendarId, userShareId);
        res.status(201).json({success: true});
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({error: error.message});
        }
        if (error.message.includes('yourself')) {
            return res.status(400).json({error: error.message});
        }
        if (error.message.includes('already shared')) {
            return res.status(409).json({error: error.message});
        }
        res.status(500).json({error: error.message || 'Erreur lors du partage'});
    }
});

// Accepter un partage via lien
router.post('/accept/:calendarId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await shareService.acceptShareByCalendarId(req.params.calendarId, req.user!.userId);
        res.json({success: true});
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({error: error.message});
        }
        if (error.message.includes('yourself')) {
            return res.status(400).json({error: error.message});
        }
        if (error.message.includes('already shared')) {
            return res.status(409).json({error: error.message});
        }
        res.status(500).json({error: error.message || 'Erreur lors de l\'acceptation'});
    }
});

// Obtenir les calendriers partagés avec l'utilisateur
router.get('/shared-with-me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const shares = await shareService.getSharedCalendarsForUser(req.user!.userId);
        res.json({shares});
    } catch (error: any) {
        res.status(500).json({error: 'Erreur lors de la récupération des partages'});
    }
});

// Obtenir les partages d'un calendrier
router.get('/calendar/:calendarId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const shares = await shareService.getSharesByCalendarId(req.user!.userId, req.params.calendarId);
        res.json({shares});
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({error: error.message});
        }
        res.status(500).json({error: 'Erreur lors de la récupération des partages'});
    }
});

// Supprimer un partage
router.delete('/:shareId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await shareService.deleteShareById(req.user!.userId, req.params.shareId);
        res.json({success: true});
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({error: error.message});
        }
        res.status(500).json({error: 'Erreur lors de la suppression du partage'});
    }
});

// Retirer un partage pour un utilisateur spécifique
router.delete('/calendar/:calendarId/user/:userShareId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await shareService.removeShareForUser(req.user!.userId, req.params.calendarId, req.params.userShareId);
        res.json({success: true});
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({error: error.message});
        }
        res.status(500).json({error: 'Erreur lors de la suppression du partage'});
    }
});

export default router;
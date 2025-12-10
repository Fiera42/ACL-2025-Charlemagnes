import express, { Response, Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ServiceFactory } from '../../factories/ServiceFactory';

const router: Router = express.Router();
const pauseService = ServiceFactory.getPauseService();

/**
 * Récupérer toutes les pauses liées à une récurrence
 */
router.get(
    '/recurrent/:recurrentAppointmentId',
    authenticateToken,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const pauses = await pauseService.getPausesByRecurrentAppointmentId(
                req.params.recurrentAppointmentId
            );
            res.json({ pauses });
        } catch (error) {
            res.status(500).json({
                error: 'Erreur lors de la récupération des pauses'
            });
        }
    }
);

/**
 * Récupérer une pause par ID
 */
router.get('/:pauseId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const pause = await pauseService.getPauseById(req.params.pauseId);

        if (!pause) {
            return res.status(404).json({ error: 'Pause introuvable' });
        }

        res.json(pause);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de la pause' });
    }
});

/**
 * Créer une pause
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { recurrentAppointmentId, pauseStartDate, pauseEndDate } = req.body;

        const pause = await pauseService.createPause(
            recurrentAppointmentId,
            new Date(pauseStartDate),
            new Date(pauseEndDate)
        );

        res.status(201).json(pause);
    } catch (error: any) {
        console.error("POST /api/pause error:", error);
        res.status(500).json({
            error: error.message || 'Erreur lors de la création de la pause'
        });
    }
});

/**
 * Mettre à jour une pause
 */
router.put('/:pauseId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { pauseStartDate, pauseEndDate } = req.body;

        await pauseService.updatePause(
            req.params.pauseId,
            {
                pauseStartDate: pauseStartDate ? new Date(pauseStartDate) : undefined,
                pauseEndDate: pauseEndDate ? new Date(pauseEndDate) : undefined
            }
        );

        const updated = await pauseService.getPauseById(req.params.pauseId);
        res.json(updated);
    } catch (error: any) {
        console.error(`PUT /api/pause/${req.params.pauseId} error:`, error);
        res.status(500).json({
            error: error.message || 'Erreur lors de la mise à jour de la pause'
        });
    }
});

/**
 * Supprimer une pause
 */
router.delete('/:pauseId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await pauseService.deletePause(req.params.pauseId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression de la pause' });
    }
});

/**
 * Vérifier si une date est dans une pause
 */
router.get(
    '/isInPause/:recurrentAppointmentId/:date',
    authenticateToken,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const isInPause = await pauseService.isDateInPause(
                req.params.recurrentAppointmentId,
                new Date(req.params.date)
            );

            res.json({ isInPause });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la vérification de la pause' });
        }
    }
);

export default router;
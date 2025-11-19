import express, { Response, Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ServiceFactory } from '../../factories/ServiceFactory';

const router: Router = express.Router();
const tagService = ServiceFactory.getTagService();

// Liste des tags du user courant
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tags = await tagService.getTagsByOwnerId(req.user!.userId);
        res.json({ tags });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des tags' });
    }
});

// Récupération d’un tag par id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tag = await tagService.getTagById(req.params.id);
        if (!tag || tag.createdBy !== req.user!.userId) {
            return res.status(404).json({ error: 'Tag introuvable' });
        }
        res.json(tag);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du tag' });
    }
});

// Création d’un tag
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, color } = req.body;
        const tag = await tagService.createTag(req.user!.userId, name, color);
        res.status(201).json(tag);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Erreur lors de la création du tag' });
    }
});

// Mise à jour d’un tag
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log(`PUT /api/tag/${req.params.id} body:`, req.body);
        const { name, color } = req.body;
        await tagService.updateTag(req.user!.userId, req.params.id, { name, color });
        const updated = await tagService.getTagById(req.params.id);
        res.json(updated);
    } catch (error: any) {
        console.error(`PUT /api/tag/${req.params.id} error:`, error);
        res.status(500).json({ error: error.message || 'Erreur lors de la mise à jour du tag' });
    }
});

// Suppression d’un tag
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await tagService.deleteTag(req.user!.userId, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression du tag' });
    }
});

export default router;

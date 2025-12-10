import express, {Request, Response, Router} from 'express';
import {ServiceFactory} from "../../factories/ServiceFactory.ts";
import {AuthenticatedRequest, authenticateToken, banAuthToken, createAuthToken} from "../middleware/auth.ts";
import {ServiceResponse} from "../../../domain/entities/ServiceResponse.ts";

const router: Router = express.Router();
const authService = ServiceFactory.getAuthService()

router.get('/user/:email', async (req: Request, res: Response) => {
    try {
        const user = await authService.findUserByEmail(req.params.email);
        if (user === null) {
            return res.status(404).json({ error: 'Utilisateur inconnu' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
});

router.put('/user/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const response = (req.params.id === req.user!.userId)
            ? await authService.updateUser(req.user!.userId, req.body)
            : ServiceResponse.FORBIDDEN;

        switch (response) {
            case ServiceResponse.SUCCESS:
                res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
                break;
            case ServiceResponse.FAILED:
                res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
                break;
            case ServiceResponse.RESOURCE_NOT_EXIST:
                res.status(404).json({ error: 'Utilisateur inconnu' });
                break;
            case ServiceResponse.FORBIDDEN:
                res.status(403).json({ error: 'Accès interdit' });
                break;
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
});

router.delete('/user/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const response = (req.params.id === req.user!.userId)
            ? await authService.deleteUser(req.user!.userId)
            : ServiceResponse.FORBIDDEN;

        switch (response) {
            case ServiceResponse.SUCCESS:
                res.status(200).json({ message: 'Utilisateur supprimé avec succès' });

                const authHeader = req.headers['authorization'];
                const token = authHeader?.split(' ')[1];

                if (token) {
                    banAuthToken(token);
                }
                break;
            case ServiceResponse.FAILED:
                res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
                break;
            case ServiceResponse.RESOURCE_NOT_EXIST:
                res.status(404).json({ error: 'Utilisateur inconnu' });
                break;
            case ServiceResponse.FORBIDDEN:
                res.status(403).json({ error: 'Accès interdit' });
                break;
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { id, password } = req.body;

        let user = await authService.findUserByUsername(id);
        if (!user) {
            user = await authService.findUserByEmail(id);
        }

        if (user !== null && await authService.verifyPassword(user, password)) {
            const token = await createAuthToken({userId: user.id as string, email: user.email});
            res.status(200).json(token);
        } else if (user === null) {
            res.status(404).json({ error: 'Utilisateur inconnu' });
        } else {
            res.status(401).json({ error: 'Mot de passe incorrect' });
        }
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await authService.createUser(username, password);
        const token = await createAuthToken({userId: user.id as string, email: user.email})
        res.status(201).json(token);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
});

router.delete('/logout/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(req.params.id === req.user!.userId) {
            res.status(403).json({ error: 'Accès interdit' });
            return;
        }

        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'Token manquant' });
            return;
        }

        banAuthToken(token);

        res.status(205).json(token);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la déconnexion" });
    }
});

router.get('/user/id/:id', async (req: Request, res: Response) => {
    try {
        const user = await authService.findUserById(req.params.id);
        if (user === null) {
            return res.status(404).json({ error: 'Utilisateur inconnu' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
});

router.get('/user/username/:username', async (req: Request, res: Response) => {
    try {
        const user = await authService.findUserByUsername(req.params.username);
        if (user === null) {
            return res.status(404).json({ error: 'Utilisateur inconnu' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
});


export default router;
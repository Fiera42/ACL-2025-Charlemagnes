import express, { Request, Response, Router } from 'express';
import {ServiceFactory} from "../../factories/ServiceFactory.ts";
import {createAuthToken} from "../middleware/auth.ts";

const router: Router = express.Router();
const authService = ServiceFactory.getAuthService()

/**
router.get('/', (req: Request, res: Response) => {
    res.redirect('/index.html');
});
    */

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { id, password } = req.body;
        const user = await authService.findUserById(id);
        if(user !== null && await authService.verifyPassword(user, password)) {
            const token = createAuthToken({userId: user.id as string, email: user.email})
            res.status(200).json(token);
        }
        else if(user === null) {
            res.status(404);
        }
        else {
            res.status(401);
        }

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la connexion" });
    }
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        const user = await authService.createUser(username, email, password);
        const token = createAuthToken({userId: user.id as string, email: user.email})
        res.status(201).json(token);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
});

router.get('/logout', async (req: Request, res: Response) => {
    // Logique de déconnexion
    res.json({ message: 'Logout endpoint' });
});

export default router;

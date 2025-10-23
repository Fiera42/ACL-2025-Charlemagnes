import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

/**
router.get('/', (req: Request, res: Response) => {
    res.redirect('/index.html');
});
    */

router.post('/login', (req: Request, res: Response) => {
    // Logique de connexion
    // Vérifier les credentials, générer JWT, etc.
    res.json({ message: 'Login endpoint' });
});

router.post('/register', (req: Request, res: Response) => {
    // Logique d'inscription
    res.json({ message: 'Register endpoint' });
});

router.get('/logout', (req: Request, res: Response) => {
    // Logique de déconnexion
    res.json({ message: 'Logout endpoint' });
});

export default router;

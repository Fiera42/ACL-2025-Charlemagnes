import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
    user?: string | JwtPayload;
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Token manquant' });
        return;
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret_par_defaut',
        (err, user) => {
            if (err) {
                res.status(403).json({ error: 'Token invalide ou expiré' });
                return;
            }
            req.user = user;
            next();
        }
    );
}
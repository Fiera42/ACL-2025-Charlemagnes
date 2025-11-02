import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
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
        req.user = user as JwtPayload | undefined;
        next();
      }
  );
}

export function createAuthToken(user: JwtPayload): Promise<string> {
  return new Promise((resolve, _) => {
    jwt.sign(
        user,
        process.env.JWT_SECRET || 'secret_par_defaut',
        (err: any, asyncToken: any) => {
          if (err) throw err;
          resolve(asyncToken);
        });
  });
}
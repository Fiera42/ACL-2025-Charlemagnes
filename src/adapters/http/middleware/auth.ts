import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {webcrypto} from "node:crypto";

// Add random noise to the token to invalidate everything on server re-start
const JWT_RANDOM_INSTANCE: string = webcrypto.getRandomValues(new Uint8Array(10)).join();
const JWT_SECRET: string = (process.env.JWT_SECRET || 'secret_par_defaut') + JWT_RANDOM_INSTANCE;

const JWT_TOKEN_DURATION_SECONDS: number = 1800 // IN SECONDS

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

  updateBannedTokens();
  if(bannedTokens.has(token)) {
      res.status(403).json({ error: 'Token invalide ou expiré' });
      return;
  }

  jwt.verify(
      token,
      JWT_SECRET,
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
        JWT_SECRET,
        {expiresIn: JWT_TOKEN_DURATION_SECONDS * 10},
        (err: any, asyncToken: any) => {
          if (err) throw err;
          resolve(asyncToken);
        });
  });
}

const bannedTokens: Map<string, number> = new Map();

export function banAuthToken(token: string): void {
    updateBannedTokens();

    // Ban the new token
    const validityTime: number = Date.now() + (JWT_TOKEN_DURATION_SECONDS * 10);
    bannedTokens.set(token, validityTime);
}

export function updateBannedTokens() {
    const now = Date.now();
    for (const [token, date] of bannedTokens) {
        if (date <= now) bannedTokens.delete(token);
    }
}
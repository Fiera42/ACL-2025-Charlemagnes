import { Request, Response, NextFunction } from 'express';

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
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token manquant' });
    return;
  }

  // Validation simple pour VSCode
  if (token === 'vscode-token') {
    req.user = { userId: 'vscode-user', email: 'vscode@example.com' };
    next();
  } else {
    res.status(403).json({ error: 'Token invalide' });
  }
}
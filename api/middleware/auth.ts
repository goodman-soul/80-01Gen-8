import type { Request, Response, NextFunction } from "express";
import type { User } from "../../shared/types.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

const sessions: Map<string, User> = new Map();

export const createSession = (user: User): string => {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessions.set(sessionId, user);
  return sessionId;
};

export const destroySession = (sessionId: string): void => {
  sessions.delete(sessionId);
};

export const getSessionUser = (sessionId: string | undefined): User | undefined => {
  if (!sessionId) return undefined;
  return sessions.get(sessionId);
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const sessionId = req.headers["x-session-id"] as string;
  const user = getSessionUser(sessionId);

  if (!user) {
    res.status(401).json({
      success: false,
      message: "未登录或登录已过期",
    });
    return;
  }

  req.user = user;
  req.sessionId = sessionId;
  next();
};

export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "权限不足",
      });
      return;
    }
    next();
  };
};

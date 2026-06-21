import express, { type Request, type Response } from "express";
import { findUserByUsername, passwords } from "../data/store.js";
import { createSession, destroySession, authMiddleware } from "../middleware/auth.js";
import type { ApiResponse, LoginRequest, User } from "../../shared/types.js";

const router = express.Router();

router.post(
  "/login",
  (req: Request<unknown, unknown, LoginRequest>, res: Response<ApiResponse<{ user: User; sessionId: string }>>): void => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      res.status(400).json({
        success: false,
        message: "请填写完整的登录信息",
      });
      return;
    }

    const user = findUserByUsername(username);
    if (!user || user.role !== role) {
      res.status(401).json({
        success: false,
        message: "账号或角色不正确",
      });
      return;
    }

    if (passwords[username] !== password) {
      res.status(401).json({
        success: false,
        message: "密码错误",
      });
      return;
    }

    const sessionId = createSession(user);
    res.json({
      success: true,
      data: { user, sessionId },
    });
  },
);

router.post(
  "/logout",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<null>>): void => {
    if (req.sessionId) {
      destroySession(req.sessionId);
    }
    res.json({ success: true });
  },
);

export default router;

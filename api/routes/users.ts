import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import type { ApiResponse, User } from "../../shared/types.js";

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<User>>): void => {
    res.json({ success: true, data: req.user });
  },
);

export default router;

import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getOverviewStatistics } from "../services/statisticsService.js";
import type { ApiResponse, ClubStatistics } from "../../shared/types.js";

const router = express.Router();

router.get(
  "/overview",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<ClubStatistics[]>>): void => {
    const stats = getOverviewStatistics(req.user!);
    res.json({ success: true, data: stats });
  },
);

export default router;

import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { clubs, findClubById } from "../data/store.js";
import { getClubStatistics } from "../services/statisticsService.js";
import type { ApiResponse, Club, ClubStatistics } from "../../shared/types.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<Club[]>>): void => {
    let result: Club[];

    if (req.user!.role === "finance") {
      result = [...clubs];
    } else if (req.user!.role === "teacher") {
      result = clubs.filter((c) => c.teacherId === req.user!.id);
    } else if (req.user!.role === "president" && req.user!.clubId) {
      const c = findClubById(req.user!.clubId);
      result = c ? [c] : [];
    } else {
      result = [];
    }

    res.json({ success: true, data: result });
  },
);

router.get(
  "/:id",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<Club>>): void => {
    const club = findClubById(req.params.id);
    if (!club) {
      res.status(404).json({ success: false, message: "社团不存在" });
      return;
    }

    if (req.user!.role === "president" && req.user!.clubId !== club.id) {
      res.status(403).json({ success: false, message: "无权访问" });
      return;
    }
    if (req.user!.role === "teacher" && req.user!.id !== club.teacherId) {
      res.status(403).json({ success: false, message: "无权访问" });
      return;
    }

    res.json({ success: true, data: club });
  },
);

router.get(
  "/:id/statistics",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<ClubStatistics>>): void => {
    const club = findClubById(req.params.id);
    if (!club) {
      res.status(404).json({ success: false, message: "社团不存在" });
      return;
    }

    if (req.user!.role === "president" && req.user!.clubId !== club.id) {
      res.status(403).json({ success: false, message: "无权访问" });
      return;
    }
    if (req.user!.role === "teacher" && req.user!.id !== club.teacherId) {
      res.status(403).json({ success: false, message: "无权访问" });
      return;
    }

    res.json({ success: true, data: getClubStatistics(club) });
  },
);

export default router;

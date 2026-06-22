import express, { type Request, type Response } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import {
  createApplication,
  updateApplication,
  teacherReview,
  financeReview,
  resubmitApplication,
} from "../services/applicationService.js";
import { findApplicationById } from "../data/store.js";
import { filterApplicationsByUser } from "../services/statisticsService.js";
import type {
  ApiResponse,
  CreateApplicationRequest,
  FinanceReviewRequest,
  ReimbursementApplication,
  TeacherReviewRequest,
} from "../../shared/types.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<ReimbursementApplication[]>>): void => {
    const { status, clubId } = req.query;
    let apps = filterApplicationsByUser(req.user!);

    if (status) {
      apps = apps.filter((a) => a.status === status);
    }
    if (clubId) {
      apps = apps.filter((a) => a.clubId === clubId);
    }

    apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, data: apps });
  },
);

router.get(
  "/:id",
  authMiddleware,
  (req: Request, res: Response<ApiResponse<ReimbursementApplication>>): void => {
    const app = findApplicationById(req.params.id as string);
    if (!app) {
      res.status(404).json({ success: false, message: "申请不存在" });
      return;
    }

    if (req.user!.role === "president" && app.presidentId !== req.user!.id) {
      res.status(403).json({ success: false, message: "无权访问" });
      return;
    }
    if (req.user!.role === "teacher" && app.teacherId !== req.user!.id) {
      res.status(403).json({ success: false, message: "无权访问" });
      return;
    }

    res.json({ success: true, data: app });
  },
);

router.post(
  "/",
  authMiddleware,
  requireRoles("president"),
  (
    req: Request<unknown, unknown, CreateApplicationRequest>,
    res: Response<ApiResponse<ReimbursementApplication>>,
  ): void => {
    const result = createApplication(req.user!, req.body);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res.status(201).json({ success: true, data: result.data });
  },
);

router.put(
  "/:id",
  authMiddleware,
  (
    req: Request,
    res: Response<ApiResponse<ReimbursementApplication>>,
  ): void => {
    const result = updateApplication(req.user!, req.params.id as string, req.body);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res.json({ success: true, data: result.data });
  },
);

router.post(
  "/:id/review-teacher",
  authMiddleware,
  requireRoles("teacher"),
  (
    req: Request,
    res: Response<ApiResponse<ReimbursementApplication>>,
  ): void => {
    const { approved, rejectReason } = req.body as TeacherReviewRequest;
    const result = teacherReview(req.user!, req.params.id as string, approved, rejectReason);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res.json({ success: true, data: result.data });
  },
);

router.post(
  "/:id/review-finance",
  authMiddleware,
  requireRoles("finance"),
  (
    req: Request,
    res: Response<ApiResponse<ReimbursementApplication>>,
  ): void => {
    const { approved, rejectReason, markPaid } = req.body as FinanceReviewRequest;
    const result = financeReview(
      req.user!,
      req.params.id as string,
      approved,
      markPaid ?? false,
      rejectReason,
    );
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res.json({ success: true, data: result.data });
  },
);

router.post(
  "/:id/resubmit",
  authMiddleware,
  requireRoles("president"),
  (
    req: Request,
    res: Response<ApiResponse<ReimbursementApplication>>,
  ): void => {
    const result = resubmitApplication(req.user!, req.params.id as string);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res.json({ success: true, data: result.data });
  },
);

export default router;

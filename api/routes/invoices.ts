import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { isInvoiceDuplicate } from "../services/invoiceService.js";
import type { ApiResponse } from "../../shared/types.js";

const router = express.Router();

router.get(
  "/check",
  authMiddleware,
  (
    req: Request,
    res: Response<
      ApiResponse<{
        isDuplicate: boolean;
        applicationId?: string;
        activityName?: string;
      }>
    >,
  ): void => {
    const { invoiceNumber, excludeApplicationId } = req.query;
    if (!invoiceNumber || typeof invoiceNumber !== "string") {
      res.status(400).json({ success: false, message: "请提供发票号" });
      return;
    }

    const result = isInvoiceDuplicate(
      invoiceNumber,
      typeof excludeApplicationId === "string" ? excludeApplicationId : undefined,
    );
    res.json({ success: true, data: result });
  },
);

export default router;

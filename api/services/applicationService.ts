import type {
  ReimbursementApplication,
  CreateApplicationRequest,
  User,
  Invoice,
  UploadedFile,
} from "../../shared/types.js";
import {
  applications,
  findApplicationById,
  findClubById,
} from "../data/store.js";
import { validateInvoices } from "./invoiceService.js";
import { updateClubStats } from "./statisticsService.js";

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const createApplication = (
  user: User,
  data: CreateApplicationRequest,
): { success: boolean; data?: ReimbursementApplication; message?: string } => {
  if (user.role !== "president" || !user.clubId) {
    return { success: false, message: "只有社长可以创建报销申请" };
  }

  const club = findClubById(user.clubId);
  if (!club) {
    return { success: false, message: "社团不存在" };
  }

  const invoiceValidation = validateInvoices(data.invoices);
  if (!invoiceValidation.valid) {
    return {
      success: false,
      message: [...invoiceValidation.errors, ...invoiceValidation.duplicates].join("；"),
    };
  }

  const now = new Date().toISOString();
  const appId = generateId("app");

  const invoices: Invoice[] = data.invoices.map((inv) => ({
    id: generateId("inv"),
    invoiceNumber: inv.invoiceNumber,
    amount: inv.amount,
    applicationId: appId,
    uploadedAt: now,
  }));

  const mapFiles = (
    files: UploadedFile[],
    type: "budget" | "invoice" | "payment",
  ): UploadedFile[] =>
    files.map((f) => ({
      ...f,
      id: f.id || generateId("file"),
      type,
    }));

  const application: ReimbursementApplication = {
    id: appId,
    clubId: user.clubId,
    activityName: data.activityName,
    activityDate: data.activityDate,
    activityDescription: data.activityDescription,
    amount: data.amount,
    presidentId: user.id,
    teacherId: club.teacherId,
    status: "pending_teacher",
    budgetFiles: mapFiles(data.budgetFiles, "budget"),
    invoices,
    paymentFiles: mapFiles(data.paymentFiles, "payment"),
    createdAt: now,
    updatedAt: now,
  };

  applications.push(application);
  updateClubStats(user.clubId);

  return { success: true, data: application };
};

export const updateApplication = (
  user: User,
  applicationId: string,
  data: Partial<CreateApplicationRequest>,
): { success: boolean; data?: ReimbursementApplication; message?: string } => {
  const app = findApplicationById(applicationId);
  if (!app) {
    return { success: false, message: "申请不存在" };
  }

  if (user.role === "president" && app.presidentId !== user.id) {
    return { success: false, message: "只能修改自己创建的申请" };
  }

  if (
    app.status !== "draft" &&
    app.status !== "rejected_teacher" &&
    app.status !== "rejected_finance"
  ) {
    return { success: false, message: "当前状态不可修改" };
  }

  const invoicesToCheck = data.invoices || app.invoices;
  const invoiceValidation = validateInvoices(
    invoicesToCheck.map((i) => ({
      invoiceNumber: i.invoiceNumber,
      amount: i.amount,
    })),
    applicationId,
  );
  if (!invoiceValidation.valid) {
    return {
      success: false,
      message: [...invoiceValidation.errors, ...invoiceValidation.duplicates].join("；"),
    };
  }

  const now = new Date().toISOString();

  if (data.activityName !== undefined) app.activityName = data.activityName;
  if (data.activityDate !== undefined) app.activityDate = data.activityDate;
  if (data.activityDescription !== undefined)
    app.activityDescription = data.activityDescription;
  if (data.amount !== undefined) app.amount = data.amount;
  if (data.budgetFiles !== undefined) app.budgetFiles = data.budgetFiles;
  if (data.paymentFiles !== undefined) app.paymentFiles = data.paymentFiles;
  if (data.invoices !== undefined) {
    app.invoices = data.invoices.map((inv) => ({
      id: generateId("inv"),
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      applicationId: app.id,
      uploadedAt: now,
    }));
  }

  app.updatedAt = now;
  app.teacherRejectReason = undefined;
  app.financeRejectReason = undefined;
  app.status = "pending_teacher";

  updateClubStats(app.clubId);

  return { success: true, data: app };
};

export const teacherReview = (
  user: User,
  applicationId: string,
  approved: boolean,
  rejectReason?: string,
): { success: boolean; data?: ReimbursementApplication; message?: string } => {
  const app = findApplicationById(applicationId);
  if (!app) {
    return { success: false, message: "申请不存在" };
  }

  if (app.teacherId !== user.id) {
    return { success: false, message: "只有对应的指导老师可以审核" };
  }

  if (app.status !== "pending_teacher") {
    return { success: false, message: "当前状态不可审核" };
  }

  if (!approved && (!rejectReason || rejectReason.trim().length < 5)) {
    return {
      success: false,
      message: "驳回时请填写详细的原因（至少5个字），方便学生理解和修改",
    };
  }

  const now = new Date().toISOString();
  app.updatedAt = now;

  if (approved) {
    app.status = "pending_finance";
    app.teacherRejectReason = undefined;
  } else {
    app.status = "rejected_teacher";
    app.teacherRejectReason = rejectReason!.trim();
  }

  updateClubStats(app.clubId);

  return { success: true, data: app };
};

export const financeReview = (
  _user: User,
  applicationId: string,
  approved: boolean,
  markPaid: boolean,
  rejectReason?: string,
): { success: boolean; data?: ReimbursementApplication; message?: string } => {
  const app = findApplicationById(applicationId);
  if (!app) {
    return { success: false, message: "申请不存在" };
  }

  if (app.status !== "pending_finance" && app.status !== "approved") {
    return { success: false, message: "当前状态不可复核" };
  }

  if (!approved && (!rejectReason || rejectReason.trim().length < 5)) {
    return {
      success: false,
      message: "驳回时请填写详细的原因（至少5个字），方便学生理解和修改",
    };
  }

  const now = new Date().toISOString();
  app.updatedAt = now;

  if (approved) {
    if (markPaid) {
      app.status = "paid";
      app.paidAt = now;
      app.financeRejectReason = undefined;
    } else {
      app.status = "approved";
      app.financeRejectReason = undefined;
    }
  } else {
    app.status = "rejected_finance";
    app.financeRejectReason = rejectReason!.trim();
  }

  updateClubStats(app.clubId);

  return { success: true, data: app };
};

export const resubmitApplication = (
  user: User,
  applicationId: string,
): { success: boolean; data?: ReimbursementApplication; message?: string } => {
  const app = findApplicationById(applicationId);
  if (!app) {
    return { success: false, message: "申请不存在" };
  }

  if (app.presidentId !== user.id) {
    return { success: false, message: "只能重新提交自己的申请" };
  }

  if (app.status !== "rejected_teacher" && app.status !== "rejected_finance") {
    return { success: false, message: "只有被驳回的申请可以重新提交" };
  }

  app.status = "pending_teacher";
  app.updatedAt = new Date().toISOString();
  updateClubStats(app.clubId);

  return { success: true, data: app };
};

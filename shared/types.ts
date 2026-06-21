export type UserRole = "president" | "teacher" | "finance";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  clubId?: string;
  avatar?: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  semesterBudget: number;
  usedAmount: number;
  pendingAmount: number;
  teacherId: string;
}

export type ApplicationStatus =
  | "draft"
  | "pending_teacher"
  | "rejected_teacher"
  | "pending_finance"
  | "rejected_finance"
  | "approved"
  | "paid";

export interface UploadedFile {
  id: string;
  name: string;
  type: "budget" | "invoice" | "payment";
  url: string;
  size: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  applicationId: string;
  uploadedAt: string;
}

export interface ReimbursementApplication {
  id: string;
  clubId: string;
  activityName: string;
  activityDate: string;
  activityDescription: string;
  amount: number;
  presidentId: string;
  teacherId: string;
  status: ApplicationStatus;
  budgetFiles: UploadedFile[];
  invoices: Invoice[];
  paymentFiles: UploadedFile[];
  teacherRejectReason?: string;
  financeRejectReason?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface ClubStatistics {
  clubId: string;
  clubName: string;
  semesterBudget: number;
  usedAmount: number;
  pendingAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  totalApplications: number;
  paidApplications: number;
  pendingApplications: number;
}

export interface TeacherReviewRequest {
  approved: boolean;
  rejectReason?: string;
}

export interface FinanceReviewRequest {
  approved: boolean;
  rejectReason?: string;
  markPaid?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface CreateApplicationRequest {
  activityName: string;
  activityDate: string;
  activityDescription: string;
  amount: number;
  budgetFiles: UploadedFile[];
  invoices: Omit<Invoice, "id" | "applicationId" | "uploadedAt">[];
  paymentFiles: UploadedFile[];
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "草稿",
  pending_teacher: "待老师审核",
  rejected_teacher: "老师已驳回",
  pending_finance: "待财务复核",
  rejected_finance: "财务已驳回",
  approved: "审核通过待支付",
  paid: "已支付",
};

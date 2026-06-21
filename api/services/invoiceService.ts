import type { Invoice } from "../../shared/types.js";
import { getInvoices, findApplicationById } from "../data/store.js";

export const isInvoiceDuplicate = (
  invoiceNumber: string,
  excludeApplicationId?: string,
): { isDuplicate: boolean; applicationId?: string; activityName?: string } => {
  const invoices = getInvoices();
  const found = invoices.find(
    (inv) =>
      inv.invoiceNumber.trim() === invoiceNumber.trim() &&
      inv.applicationId !== excludeApplicationId,
  );

  if (found) {
    const app = findApplicationById(found.applicationId);
    return {
      isDuplicate: true,
      applicationId: found.applicationId,
      activityName: app?.activityName,
    };
  }

  return { isDuplicate: false };
};

export const validateInvoices = (
  invoices: Omit<Invoice, "id" | "applicationId" | "uploadedAt">[],
  excludeApplicationId?: string,
): { valid: boolean; errors: string[]; duplicates: string[] } => {
  const errors: string[] = [];
  const duplicates: string[] = [];
  const seenInBatch = new Set<string>();

  for (const inv of invoices) {
    if (!inv.invoiceNumber.trim()) {
      errors.push("发票号不能为空");
      continue;
    }
    if (inv.amount <= 0) {
      errors.push(`发票 ${inv.invoiceNumber} 金额必须大于0`);
    }
    if (seenInBatch.has(inv.invoiceNumber.trim())) {
      duplicates.push(
        `发票号 ${inv.invoiceNumber} 在本次申请中重复出现`,
      );
    }
    seenInBatch.add(inv.invoiceNumber.trim());

    const dup = isInvoiceDuplicate(inv.invoiceNumber, excludeApplicationId);
    if (dup.isDuplicate) {
      duplicates.push(
        `发票号 ${inv.invoiceNumber} 已被活动「${dup.activityName}」使用，不能重复报销`,
      );
    }
  }

  return {
    valid: errors.length === 0 && duplicates.length === 0,
    errors,
    duplicates,
  };
};

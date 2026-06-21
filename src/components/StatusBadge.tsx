import type { ApplicationStatus, STATUS_LABELS } from "../../shared/types";

interface Props {
  status: ApplicationStatus;
  size?: "sm" | "md";
}

const statusMap: Record<
  ApplicationStatus,
  { label: string; className: string; dot: string }
> = {
  draft: {
    label: "草稿",
    className: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  pending_teacher: {
    label: "待老师审核",
    className: "bg-warning-100 text-warning-700",
    dot: "bg-warning-500",
  },
  rejected_teacher: {
    label: "老师已驳回",
    className: "bg-danger-100 text-danger-700",
    dot: "bg-danger-500",
  },
  pending_finance: {
    label: "待财务复核",
    className: "bg-primary-50 text-primary-700",
    dot: "bg-primary-500",
  },
  rejected_finance: {
    label: "财务已驳回",
    className: "bg-danger-100 text-danger-700",
    dot: "bg-danger-500",
  },
  approved: {
    label: "审核通过待支付",
    className: "bg-success-50 text-success-700",
    dot: "bg-success-500",
  },
  paid: {
    label: "已支付",
    className: "bg-success-100 text-success-700",
    dot: "bg-success-600",
  },
};

export default function StatusBadge({ status, size = "sm" }: Props) {
  const s = statusMap[status];
  const padding = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${s.className}`}
    >
      <span className={`rounded-full ${dotSize} ${s.dot}`} />
      {s.label}
    </span>
  );
}

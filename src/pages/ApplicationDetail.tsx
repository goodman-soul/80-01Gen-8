import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import type { ReimbursementApplication, Club } from "../../../shared/types";
import { useAuthStore } from "@/store/auth";
import { apiRequest, formatMoney, formatDate, formatDateTime } from "@/utils/api";
import { useToast } from "@/components/Toast";
import StatusBadge from "@/components/StatusBadge";

const steps = [
  { key: "submit", label: "社长提交", statuses: ["draft", "pending_teacher", "rejected_teacher", "pending_finance", "rejected_finance", "approved", "paid"] },
  { key: "teacher", label: "指导老师审核", statuses: ["pending_teacher", "rejected_teacher", "pending_finance", "rejected_finance", "approved", "paid"], rejectStatus: "rejected_teacher" },
  { key: "finance", label: "财务复核", statuses: ["pending_finance", "rejected_finance", "approved", "paid"], rejectStatus: "rejected_finance" },
  { key: "paid", label: "支付完成", statuses: ["paid"] },
];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();

  const [app, setApp] = useState<ReimbursementApplication | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [markPaid, setMarkPaid] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<"teacher" | "finance">("teacher");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const appRes = await apiRequest<ReimbursementApplication>(`/applications/${id}`);
      if (appRes.success && appRes.data) {
        setApp(appRes.data);
        const clubRes = await apiRequest<Club>(`/clubs/${appRes.data.clubId}`);
        if (clubRes.success && clubRes.data) setClub(clubRes.data);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const currentStepIdx = (() => {
    if (!app) return 0;
    if (app.status === "paid") return 3;
    if (["approved", "pending_finance", "rejected_finance"].includes(app.status)) return 2;
    if (["pending_teacher", "rejected_teacher"].includes(app.status)) return 1;
    return 0;
  })();

  const isRejected =
    app?.status === "rejected_teacher" || app?.status === "rejected_finance";

  const canTeacherReview =
    user?.role === "teacher" && app?.status === "pending_teacher" && app.teacherId === user.id;
  const canFinanceReview =
    user?.role === "finance" &&
    (app?.status === "pending_finance" || app?.status === "approved");
  const canResubmit =
    user?.role === "president" &&
    isRejected &&
    app?.presidentId === user.id;

  const doAction = async (
    endpoint: string,
    body: Record<string, unknown>,
    successMsg: string,
  ) => {
    if (!id) return;
    setProcessing(true);
    const res = await apiRequest(`/applications/${id}/${endpoint}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setProcessing(false);
    if (res.success) {
      toast.success(successMsg);
      const appRes = await apiRequest<ReimbursementApplication>(`/applications/${id}`);
      if (appRes.success && appRes.data) setApp(appRes.data);
      setShowRejectModal(false);
      setRejectReason("");
    } else {
      toast.error(res.message || "操作失败");
    }
  };

  const handleApprove = () => {
    if (canTeacherReview) {
      doAction("review-teacher", { approved: true }, "审核通过，已转交财务复核");
    } else if (canFinanceReview) {
      doAction(
        "review-finance",
        { approved: true, markPaid },
        markPaid ? "已确认支付完成" : "审核通过，待支付",
      );
    }
  };

  const handleOpenReject = (target: "teacher" | "finance") => {
    setRejectTarget(target);
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (rejectReason.trim().length < 5) {
      toast.warning("请填写至少5个字的驳回原因，方便学生理解修改");
      return;
    }
    if (rejectTarget === "teacher") {
      doAction(
        "review-teacher",
        { approved: false, rejectReason: rejectReason.trim() },
        "已驳回申请",
      );
    } else {
      doAction(
        "review-finance",
        { approved: false, rejectReason: rejectReason.trim() },
        "已驳回申请",
      );
    }
  };

  const handleResubmit = () => {
    if (!id) return;
    doAction("resubmit", {}, "已重新提交申请，等待老师审核");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-white rounded-xl animate-pulse" />
        <div className="h-64 bg-white rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="card p-16 text-center">
        <AlertTriangle className="w-12 h-12 text-warning-500 mx-auto mb-3" />
        <p className="text-slate-600 mb-4">申请不存在或您无权访问</p>
        <Link to="/dashboard" className="btn-primary inline-flex">
          返回工作台
        </Link>
      </div>
    );
  }

  const FilePreview = ({
    files,
    title,
    icon,
    color,
  }: {
    files: { id: string; name: string; url: string }[];
    title: string;
    icon: typeof FileSpreadsheet;
    color: string;
  }) => (
    <div>
      <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
        <icon className={`w-4 h-4 ${color}`} />
        {title} ({files.length})
      </h3>
      {files.length === 0 ? (
        <p className="text-sm text-slate-400">暂无上传</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((f) => (
            <div
              key={f.id}
              className="group relative rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={f.url}
                  alt={f.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5 bg-white">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {f.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl font-bold text-slate-900 truncate">
            {app.activityName}
          </h1>
          <p className="text-sm text-slate-500">
            申请编号：{app.id.toUpperCase()}
          </p>
        </div>
        <StatusBadge status={app.status} size="md" />
      </div>

      <div className="card p-6">
        <h2 className="font-serif text-lg font-bold text-slate-900 mb-5">
          审核流程
        </h2>
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-success-500 transition-all duration-500"
            style={{ width: `${(currentStepIdx / 3) * 100}%` }}
          />
          <div className="relative grid grid-cols-4 gap-4">
            {steps.map((s, i) => {
              const done = i < currentStepIdx;
              const active = i === currentStepIdx;
              const rejected =
                (s.rejectStatus === "rejected_teacher" &&
                  app.status === "rejected_teacher") ||
                (s.rejectStatus === "rejected_finance" &&
                  app.status === "rejected_finance");
              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative z-10 transition-all duration-300 ${
                      rejected
                        ? "bg-gradient-to-br from-danger-400 to-danger-600 shadow-lg shadow-danger-500/30"
                        : done
                        ? "bg-gradient-to-br from-success-400 to-success-600 shadow-lg shadow-success-500/30"
                        : active
                        ? "bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30 ring-4 ring-primary-100 animate-pulse"
                        : "bg-slate-300"
                    }`}
                  >
                    {rejected ? (
                      <XCircle className="w-5 h-5" />
                    ) : done ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : active ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <p
                    className={`mt-3 text-sm font-medium ${
                      done || active ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isRejected && (
        <div className="card p-5 border-danger-200 bg-danger-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-danger-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-danger-800 mb-1">
                {app.status === "rejected_teacher"
                  ? "指导老师驳回原因"
                  : "财务驳回原因"}
              </h3>
              <p className="text-sm text-danger-700 leading-relaxed whitespace-pre-wrap">
                {app.status === "rejected_teacher"
                  ? app.teacherRejectReason
                  : app.financeRejectReason}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900 mb-4">
              活动信息
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  所属社团
                </p>
                <p className="font-semibold text-slate-900">
                  {club?.name || "—"}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  活动日期
                </p>
                <p className="font-semibold text-slate-900">
                  {formatDate(app.activityDate)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl sm:col-span-2">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  申请金额
                </p>
                <p className="font-serif text-2xl font-bold text-primary-700">
                  {formatMoney(app.amount)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 mb-2">活动说明</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  {app.activityDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-6">
            <FilePreview
              files={app.budgetFiles}
              title="预算文件"
              icon={FileSpreadsheet}
              color="text-primary-600"
            />
            <div>
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary-600" />
                发票明细 ({app.invoices.length})
              </h3>
              {app.invoices.length === 0 ? (
                <p className="text-sm text-slate-400">暂无发票</p>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          发票号
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">
                          金额
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {app.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-3 font-mono text-slate-800">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatMoney(inv.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/80 font-semibold">
                        <td className="px-4 py-3 text-slate-600">合计</td>
                        <td className="px-4 py-3 text-right text-slate-900">
                          {formatMoney(
                            app.invoices.reduce((s, i) => s + i.amount, 0),
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <FilePreview
              files={app.paymentFiles}
              title="付款截图"
              icon={CreditCard}
              color="text-success-600"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">
              申请时间线
            </h3>
            <div className="space-y-4">
              <TimelineItem
                title="申请创建"
                time={formatDateTime(app.createdAt)}
                done
              />
              {app.status !== "draft" && (
                <TimelineItem title="提交审核" time={formatDateTime(app.createdAt)} done />
              )}
              {(app.status === "pending_teacher" ||
                app.status === "rejected_teacher" ||
                app.status === "pending_finance" ||
                app.status === "rejected_finance" ||
                app.status === "approved" ||
                app.status === "paid") && (
                <TimelineItem
                  title={
                    app.status === "rejected_teacher"
                      ? "老师已驳回"
                      : "老师审核"
                  }
                  time={formatDateTime(app.updatedAt)}
                  done={app.status !== "pending_teacher"}
                  warning={app.status === "rejected_teacher"}
                />
              )}
              {(app.status === "pending_finance" ||
                app.status === "rejected_finance" ||
                app.status === "approved" ||
                app.status === "paid") && (
                <TimelineItem
                  title={
                    app.status === "rejected_finance"
                      ? "财务已驳回"
                      : app.status === "approved"
                      ? "财务审核通过待支付"
                      : "财务复核"
                  }
                  time={formatDateTime(app.updatedAt)}
                  done={
                    app.status === "approved" ||
                    app.status === "paid" ||
                    app.status === "rejected_finance"
                  }
                  warning={app.status === "rejected_finance"}
                />
              )}
              {app.status === "paid" && app.paidAt && (
                <TimelineItem
                  title="支付完成"
                  time={formatDateTime(app.paidAt)}
                  done
                  success
                />
              )}
            </div>
          </div>

          {(canTeacherReview || canFinanceReview || canResubmit) && (
            <div className="card p-5">
              <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">
                审核操作
              </h3>
              <div className="space-y-3">
                {canTeacherReview && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="w-full btn-success flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      通过审核
                    </button>
                    <button
                      onClick={() => handleOpenReject("teacher")}
                      disabled={processing}
                      className="w-full btn-danger flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      驳回申请
                    </button>
                  </>
                )}
                {canFinanceReview && (
                  <>
                    <label className="flex items-center gap-2 text-sm text-slate-600 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={markPaid}
                        onChange={(e) => setMarkPaid(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      同时标记为已支付
                    </label>
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="w-full btn-success flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {markPaid ? "审核通过并确认支付" : "审核通过（待支付）"}
                    </button>
                    <button
                      onClick={() => handleOpenReject("finance")}
                      disabled={processing}
                      className="w-full btn-danger flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      驳回申请
                    </button>
                  </>
                )}
                {canResubmit && (
                  <button
                    onClick={handleResubmit}
                    disabled={processing}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新提交申请
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-danger-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-danger-600" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    驳回申请
                  </h3>
                  <p className="text-sm text-slate-500">
                    请填写驳回原因，方便学生理解和修改
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="p-4 bg-warning-50 rounded-xl border border-warning-100 mb-4">
                <p className="text-sm text-warning-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    请用通俗易懂的语言说明驳回原因，例如具体指出哪张发票有问题、缺少什么材料等。学生只有看懂了才能正确修改哦～
                  </span>
                </p>
              </div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                驳回原因 <span className="text-danger-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                className="input-field resize-none"
                placeholder="请详细说明驳回原因，至少5个字。例如：第2张发票内容模糊，请重新上传清晰的照片；预算明细表缺少单价列..."
              />
              <p className="text-xs text-slate-400 mt-2">
                已输入 {rejectReason.length} 字
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={processing}
                className="btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="btn-danger flex items-center gap-2"
              >
                {processing && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  title,
  time,
  done,
  success,
  warning,
}: {
  title: string;
  time: string;
  done?: boolean;
  success?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
          success
            ? "bg-success-500"
            : warning
            ? "bg-danger-500"
            : done
            ? "bg-primary-500"
            : "bg-slate-300"
        }`}
      />
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            done ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {title}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

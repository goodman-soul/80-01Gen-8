import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  X,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Info,
  Plus,
} from "lucide-react";
import type { CreateApplicationRequest, UploadedFile, Invoice } from "../../../shared/types";
import { useAuthStore } from "@/store/auth";
import { apiRequest } from "@/utils/api";
import { useToast } from "@/components/Toast";

type LocalInvoice = Omit<Invoice, "id" | "applicationId" | "uploadedAt">;

const fakeFile = (name: string, type: "budget" | "invoice" | "payment"): UploadedFile => ({
  id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  name,
  type,
  url: `https://picsum.photos/seed/${name}/800/600`,
  size: 102400,
});

export default function NewApplication() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [activityName, setActivityName] = useState("");
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [activityDescription, setActivityDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetFiles, setBudgetFiles] = useState<UploadedFile[]>([]);
  const [paymentFiles, setPaymentFiles] = useState<UploadedFile[]>([]);
  const [invoices, setInvoices] = useState<LocalInvoice[]>([
    { invoiceNumber: "", amount: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const [invoiceChecks, setInvoiceChecks] = useState<
    Record<number, { checking: boolean; ok: boolean; msg?: string }>
  >({});

  useEffect(() => {
    const timer = setTimeout(async () => {
      for (let i = 0; i < invoices.length; i++) {
        const inv = invoices[i];
        if (!inv.invoiceNumber.trim()) {
          setInvoiceChecks((s) => ({ ...s, [i]: { checking: false, ok: false } }));
          continue;
        }
        setInvoiceChecks((s) => ({ ...s, [i]: { checking: true, ok: false } }));
        const res = await apiRequest<{
          isDuplicate: boolean;
          activityName?: string;
        }>(`/invoices/check?invoiceNumber=${encodeURIComponent(inv.invoiceNumber)}`);
        if (res.success && res.data) {
          setInvoiceChecks((s) => ({
            ...s,
            [i]: {
              checking: false,
              ok: !res.data.isDuplicate,
              msg: res.data.isDuplicate
                ? `该发票已被活动「${res.data.activityName}」使用`
                : "发票号可用",
            },
          }));
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [JSON.stringify(invoices.map((i) => i.invoiceNumber))]);

  const addBudget = () => {
    const names = [
      "活动预算表.xlsx",
      "经费预算明细.pdf",
      "采购清单.docx",
    ];
    setBudgetFiles([
      ...budgetFiles,
      fakeFile(names[budgetFiles.length % names.length], "budget"),
    ]);
  };
  const addPayment = () => {
    const names = ["转账截图.png", "微信支付截图.jpg", "支付宝付款凭证.jpg"];
    setPaymentFiles([
      ...paymentFiles,
      fakeFile(names[paymentFiles.length % names.length], "payment"),
    ]);
  };
  const removeFile = (id: string, setter: typeof setBudgetFiles) => {
    setter((arr) => arr.filter((f) => f.id !== id));
  };

  const updateInvoice = (idx: number, field: keyof LocalInvoice, value: string) => {
    setInvoices((arr) =>
      arr.map((inv, i) =>
        i === idx
          ? { ...inv, [field]: field === "amount" ? Number(value) || 0 : value }
          : inv,
      ),
    );
  };
  const addInvoice = () =>
    setInvoices([...invoices, { invoiceNumber: "", amount: 0 }]);
  const removeInvoice = (idx: number) => {
    if (invoices.length <= 1) return;
    setInvoices(invoices.filter((_, i) => i !== idx));
    setInvoiceChecks((s) => {
      const n = { ...s };
      delete n[idx];
      return n;
    });
  };

  const totalInvoiceAmount = invoices.reduce((s, i) => s + (i.amount || 0), 0);

  const validate = (): string | null => {
    if (!activityName.trim()) return "请填写活动名称";
    if (!activityDate) return "请选择活动日期";
    if (!activityDescription.trim()) return "请填写活动说明";
    const amt = Number(amount);
    if (!amt || amt <= 0) return "请填写正确的申请金额";
    if (budgetFiles.length === 0) return "请至少上传一份预算文件";
    if (invoices.some((i) => !i.invoiceNumber.trim() || i.amount <= 0))
      return "请完整填写所有发票信息";
    const anyDup = Object.values(invoiceChecks).some((c) => !c.ok && c.msg);
    if (anyDup) return "存在重复或无效的发票号，请检查";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.warning(err);
      return;
    }
    setSubmitting(true);
    const payload: CreateApplicationRequest = {
      activityName,
      activityDate,
      activityDescription,
      amount: Number(amount),
      budgetFiles,
      invoices: invoices.filter((i) => i.invoiceNumber.trim() && i.amount > 0),
      paymentFiles,
    };
    const res = await apiRequest("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (res.success) {
      toast.success("报销申请已提交，等待指导老师审核");
      navigate("/dashboard");
    } else {
      toast.error(res.message || "提交失败");
    }
  };

  const FileList = ({
    files,
    onRemove,
    icon,
    color,
  }: {
    files: UploadedFile[];
    onRemove: (id: string) => void;
    icon: typeof FileSpreadsheet;
    color: string;
  }) => (
    <div className="space-y-2">
      {files.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
        >
          <div
            className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white flex-shrink-0`}
          >
            <icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {f.name}
            </p>
            <p className="text-xs text-slate-400">
              {(f.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={() => onRemove(f.id)}
            className="p-1.5 rounded-md text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            新建报销申请
          </h1>
          <p className="text-slate-500 text-sm">
            请填写活动信息并上传相关材料，提交后由指导老师和财务依次审核
          </p>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-2 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <Info className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <p className="text-sm text-primary-800">
            同一笔钱的发票不能在两个活动中重复报销，系统会自动检测发票号是否已被使用。
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            活动基本信息
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                活动名称 <span className="text-danger-500">*</span>
              </label>
              <input
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                className="input-field"
                placeholder="例如：2026春季编程马拉松"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                活动日期 <span className="text-danger-500">*</span>
              </label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                申请总金额（元） <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                placeholder="请输入申请报销的总金额"
              />
              {totalInvoiceAmount > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  发票总金额：¥{totalInvoiceAmount.toFixed(2)}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                活动说明 <span className="text-danger-500">*</span>
              </label>
              <textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="请简要描述活动内容、参与人数、经费使用范围等"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary-600" />
            预算文件 <span className="text-danger-500">*</span>
          </h2>
          <FileList
            files={budgetFiles}
            onRemove={(id) => removeFile(id, setBudgetFiles)}
            icon={FileSpreadsheet}
            color="bg-gradient-to-br from-blue-500 to-primary-600"
          />
          <button
            onClick={addBudget}
            className="mt-3 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            点击上传预算表（模拟）
          </button>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-600" />
            发票信息 <span className="text-danger-500">*</span>
          </h2>
          <div className="space-y-3">
            {invoices.map((inv, idx) => {
              const check = invoiceChecks[idx];
              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        发票号
                      </label>
                      <input
                        value={inv.invoiceNumber}
                        onChange={(e) =>
                          updateInvoice(idx, "invoiceNumber", e.target.value)
                        }
                        className={`input-field ${
                          check?.ok === false && check.msg
                            ? "border-danger-400 focus:ring-danger-200 focus:border-danger-500"
                            : check?.ok
                            ? "border-success-400 focus:ring-success-200 focus:border-success-500"
                            : ""
                        }`}
                        placeholder="例如：FP2026001001"
                      />
                      {check?.checking && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                          正在校验发票号...
                        </p>
                      )}
                      {!check?.checking && check?.msg && (
                        <p
                          className={`text-xs mt-1 flex items-center gap-1 ${
                            check.ok ? "text-success-600" : "text-danger-600"
                          }`}
                        >
                          {check.ok ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          {check.msg}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          金额（元）
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={inv.amount || ""}
                          onChange={(e) =>
                            updateInvoice(idx, "amount", e.target.value)
                          }
                          className="input-field"
                          placeholder="0.00"
                        />
                      </div>
                      {invoices.length > 1 && (
                        <div className="flex items-end">
                          <button
                            onClick={() => removeInvoice(idx)}
                            className="p-2.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={addInvoice}
            className="mt-3 flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            添加另一张发票
          </button>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            付款截图
          </h2>
          <FileList
            files={paymentFiles}
            onRemove={(id) => removeFile(id, setPaymentFiles)}
            icon={CreditCard}
            color="bg-gradient-to-br from-emerald-500 to-success-600"
          />
          <button
            onClick={addPayment}
            className="mt-3 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            点击上传付款截图（模拟）
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate(-1)} className="btn-outline">
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          {submitting && (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          提交申请
        </button>
      </div>
    </div>
  );
}

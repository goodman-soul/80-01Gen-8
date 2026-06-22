import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Clock,
  FileText,
  Plus,
  ChevronRight,
  Filter,
} from "lucide-react";
import type {
  ClubStatistics,
  ReimbursementApplication,
  ApplicationStatus,
} from "@shared/types";
import { useAuthStore } from "@/store/auth";
import { apiRequest, formatMoney, formatDate } from "@/utils/api";
import StatusBadge from "@/components/StatusBadge";

const tabs: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending_teacher", label: "待老师审核" },
  { key: "pending_finance", label: "待财务复核" },
  { key: "approved", label: "待支付" },
  { key: "paid", label: "已支付" },
  { key: "rejected_teacher", label: "被驳回" },
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ClubStatistics[]>([]);
  const [applications, setApplications] = useState<ReimbursementApplication[]>([]);
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [statsRes, appsRes] = await Promise.all([
        apiRequest<ClubStatistics[]>("/statistics/overview"),
        apiRequest<ReimbursementApplication[]>("/applications"),
      ]);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (appsRes.success && appsRes.data) setApplications(appsRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const myStat = stats[0];
  const filtered = activeTab === "all"
    ? applications
    : applications.filter((a) => a.status === activeTab);

  const countByStatus = (s: ApplicationStatus) =>
    applications.filter((a) => a.status === s).length;

  const pendingCount = countByStatus("pending_teacher") + countByStatus("pending_finance");

  const statCards = [
    {
      label: "本学期额度",
      value: myStat ? formatMoney(myStat.semesterBudget) : "—",
      icon: Wallet,
      color: "from-blue-500 to-primary-600",
      bg: "bg-blue-50",
    },
    {
      label: "已使用金额",
      value: myStat ? formatMoney(myStat.usedAmount) : "—",
      sub: myStat ? `${myStat.usagePercentage}% 额度使用率` : "",
      icon: TrendingUp,
      color: "from-emerald-500 to-success-600",
      bg: "bg-emerald-50",
    },
    {
      label: "待支付款项",
      value: myStat ? formatMoney(myStat.pendingAmount) : "—",
      icon: Clock,
      color: "from-amber-500 to-warning-600",
      bg: "bg-amber-50",
    },
    {
      label: "待处理申请",
      value: pendingCount.toString(),
      icon: FileText,
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900 mb-1">
          工作台
        </h1>
        <p className="text-slate-500">
          {user?.role === "president"
            ? "查看您的社团经费使用情况，管理报销申请"
            : user?.role === "teacher"
            ? "审核您指导的社团报销申请"
            : "管理全校社团经费，复核报销申请"}
        </p>
      </div>

      {myStat && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="card p-5 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-1">{s.label}</p>
                <p className="font-serif text-2xl font-bold text-slate-900">
                  {s.value}
                </p>
                {s.sub && (
                  <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                )}
                {s.label === "已使用金额" && myStat && (
                  <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-success-600 rounded-full animate-progress-fill"
                      style={{ width: `${myStat.usagePercentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="font-serif text-lg font-bold text-slate-900">
              报销申请列表
            </h2>
          </div>
          {user?.role === "president" && (
            <button
              onClick={() => navigate("/application/new")}
              className="btn-primary flex items-center gap-2 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              新建报销
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.key
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无报销申请</p>
            </div>
          ) : (
            filtered.map((app, idx) => (
              <Link
                key={app.id}
                to={`/application/${app.id}`}
                className="flex items-center gap-5 px-6 py-4 hover:bg-slate-50 transition-colors group animate-slide-up"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                      {app.activityName}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    活动日期：{formatDate(app.activityDate)} · 提交时间：
                    {formatDate(app.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-xl font-bold text-slate-900">
                    {formatMoney(app.amount)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

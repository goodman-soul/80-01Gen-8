import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  TrendingUp,
  Wallet,
  Clock,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import type { ClubStatistics, ReimbursementApplication } from "@shared/types";
import { useAuthStore } from "@/store/auth";
import { apiRequest, formatMoney, formatDate } from "@/utils/api";
import StatusBadge from "@/components/StatusBadge";

export default function Statistics() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ClubStatistics[]>([]);
  const [applications, setApplications] = useState<ReimbursementApplication[]>([]);
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

  const totalBudget = stats.reduce((s, c) => s + c.semesterBudget, 0);
  const totalUsed = stats.reduce((s, c) => s + c.usedAmount, 0);
  const totalPending = stats.reduce((s, c) => s + c.pendingAmount, 0);
  const totalRemaining = totalBudget - totalUsed - totalPending;
  const overallUsage = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;

  const summary = [
    {
      label: "全校社团总预算",
      value: formatMoney(totalBudget),
      icon: Wallet,
      gradient: "from-blue-500 to-primary-700",
      bg: "bg-blue-50",
    },
    {
      label: "已使用金额",
      value: formatMoney(totalUsed),
      sub: `${overallUsage}% 整体使用率`,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-success-700",
      bg: "bg-emerald-50",
    },
    {
      label: "待支付款项",
      value: formatMoney(totalPending),
      icon: Clock,
      gradient: "from-amber-500 to-warning-600",
      bg: "bg-amber-50",
    },
    {
      label: "剩余可用额度",
      value: formatMoney(Math.max(0, totalRemaining)),
      icon: PieChart,
      gradient: "from-violet-500 to-purple-700",
      bg: "bg-violet-50",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900 mb-1">
          经费统计
        </h1>
        <p className="text-slate-500">
          {user?.role === "finance"
            ? "查看全校各社团本学期的经费使用情况"
            : "查看您所在社团的经费使用明细"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summary.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">{s.label}</p>
              <p className="font-serif text-2xl font-bold text-slate-900">
                {s.value}
              </p>
              {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h2 className="font-serif text-lg font-bold text-slate-900">
            各社团额度使用情况
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.length === 0 ? (
            <div className="py-16 text-center">
              <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无社团数据</p>
            </div>
          ) : (
            stats.map((c, idx) => {
              const safeUsage = Math.min(c.usagePercentage, 100);
              const barColor =
                safeUsage >= 90
                  ? "from-danger-400 to-danger-600"
                  : safeUsage >= 70
                  ? "from-warning-400 to-warning-600"
                  : "from-emerald-400 to-success-600";
              return (
                <div
                  key={c.clubId}
                  className="px-6 py-5 hover:bg-slate-50 transition-colors animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {c.clubName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        共 {c.totalApplications} 笔申请 · 已支付{" "}
                        {c.paidApplications} 笔 · 待处理{" "}
                        {c.pendingApplications} 笔
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif font-bold text-slate-900">
                        {formatMoney(c.usedAmount)}
                        <span className="text-slate-400 font-normal text-sm">
                          {" "}
                          / {formatMoney(c.semesterBudget)}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        待支付：{formatMoney(c.pendingAmount)} · 剩余：
                        {formatMoney(c.remainingAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700 ease-out animate-progress-fill relative`}
                        style={{ width: `${safeUsage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20" />
                      </div>
                    </div>
                    <span
                      className={`absolute -top-6 text-xs font-semibold ${
                        safeUsage >= 90
                          ? "text-danger-600"
                          : safeUsage >= 70
                          ? "text-warning-600"
                          : "text-success-600"
                      }`}
                      style={{
                        left: `${safeUsage}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {safeUsage}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary-600" />
          <h2 className="font-serif text-lg font-bold text-slate-900">
            近期报销记录
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {applications.slice(0, 8).length === 0 ? (
            <div className="py-16 text-center">
              <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无报销记录</p>
            </div>
          ) : (
            applications.slice(0, 8).map((app, idx) => (
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
                  <p className="text-sm text-slate-500">
                    {stats.find((s) => s.clubId === app.clubId)?.clubName} ·{" "}
                    {formatDate(app.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-lg font-bold text-slate-900">
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

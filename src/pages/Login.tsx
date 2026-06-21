import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  UserCheck,
  Calculator,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import type { UserRole } from "../../../shared/types";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/components/Toast";
import { apiRequest } from "@/utils/api";

const roles: {
  key: UserRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
  gradient: string;
  ring: string;
  username: string;
  password: string;
}[] = [
  {
    key: "president",
    label: "社长",
    description: "创建报销申请、上传材料、查看审核进度",
    icon: GraduationCap,
    gradient: "from-blue-500 to-primary-700",
    ring: "ring-blue-400/50",
    username: "president01",
    password: "123456",
  },
  {
    key: "teacher",
    label: "指导老师",
    description: "审核社团报销申请、给出修改建议",
    icon: UserCheck,
    gradient: "from-emerald-500 to-success-700",
    ring: "ring-emerald-400/50",
    username: "teacher01",
    password: "123456",
  },
  {
    key: "finance",
    label: "财务人员",
    description: "复核报销、发票去重校验、支付管理",
    icon: Calculator,
    gradient: "from-violet-500 to-purple-700",
    ring: "ring-violet-400/50",
    username: "finance01",
    password: "123456",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedRole, setSelectedRole, setUser } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentRole = roles.find((r) => r.key === selectedRole)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.warning("请输入账号和密码");
      return;
    }
    setLoading(true);
    const res = await apiRequest<{ user: typeof useAuthStore.getState extends infer S ? any : any; sessionId: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password, role: selectedRole }),
      },
    );
    setLoading(false);

    if (res.success && res.data) {
      setUser(res.data.user, res.data.sessionId);
      toast.success(`欢迎回来，${res.data.user.name}！`);
      navigate("/dashboard");
    } else {
      toast.error(res.message || "登录失败");
    }
  };

  const fillDemo = () => {
    setUsername(currentRole.username);
    setPassword(currentRole.password);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/25">
              <Calculator className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">
            校园社团经费报销门户
          </h1>
          <p className="text-slate-500">透明 · 高效 · 规范的社团财务管理</p>
        </div>

        <div className="w-full max-w-5xl grid md:grid-cols-5 gap-6 animate-slide-up">
          <div className="md:col-span-3 space-y-4">
            <p className="text-sm font-medium text-slate-600 mb-2">选择登录身份：</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = selectedRole === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => {
                      setSelectedRole(r.key);
                      setUsername("");
                      setPassword("");
                    }}
                    className={`relative p-5 rounded-2xl text-left transition-all duration-300 ${
                      active
                        ? `bg-white shadow-xl ring-2 ${r.ring} scale-[1.02]`
                        : "bg-white/60 hover:bg-white hover:shadow-lg backdrop-blur"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-white mb-3 shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif font-bold text-slate-900 text-lg mb-1">
                      {r.label}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {r.description}
                    </p>
                    {active && (
                      <div
                        className={`absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br ${r.gradient} flex items-center justify-center`}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-7 border border-white/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentRole.gradient} flex items-center justify-center text-white shadow-md`}
                >
                  <currentRole.icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900">
                    {currentRole.label}登录
                  </h2>
                  <p className="text-xs text-slate-500">请输入您的账号信息</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    账号
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                    placeholder="请输入账号"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder="请输入密码"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPwd ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
                >
                  填入演示账号
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      登 录
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          © 2026 校园社团经费报销系统 · 仅用于演示
        </p>
      </div>
    </div>
  );
}

import {
  LayoutDashboard,
  FilePlus,
  PieChart,
  LogOut,
  GraduationCap,
  UserCheck,
  Calculator,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { apiRequest } from "@/utils/api";

const roleIcon = {
  president: GraduationCap,
  teacher: UserCheck,
  finance: Calculator,
};

const roleLabel = {
  president: "社长",
  teacher: "指导老师",
  finance: "财务人员",
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const Icon = roleIcon[user.role];
  const label = roleLabel[user.role];

  const handleLogout = async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "工作台" },
    ...(user.role === "president"
      ? [{ to: "/application/new", icon: FilePlus, label: "新建报销" }]
      : []),
    { to: "/statistics", icon: PieChart, label: "经费统计" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-wide">
              社团经费报销
            </h1>
            <p className="text-xs text-white/60 mt-0.5">Campus Reimbursement</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-semibold">
            {user.name.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white/15 text-white shadow-inner"
                  : "text-white/70 hover:text-white hover:bg-white/8"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </aside>
  );
}

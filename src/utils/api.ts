import type { ApiResponse } from "@shared/types";

const API_BASE = "/api";

const getSessionId = (): string | null => localStorage.getItem("sessionId");

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const sessionId = getSessionId();
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
    const data = (await res.json()) as ApiResponse<T>;
    return data;
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "网络请求失败",
    };
  }
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

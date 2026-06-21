import type {
  Club,
  ClubStatistics,
  ReimbursementApplication,
  User,
} from "../../shared/types.js";
import { clubs, applications, findClubById } from "../data/store.js";

export const getClubStatistics = (club: Club): ClubStatistics => {
  const clubApps = applications.filter((a) => a.clubId === club.id);
  const paid = clubApps.filter((a) => a.status === "paid");
  const pending = clubApps.filter(
    (a) =>
      a.status === "pending_teacher" ||
      a.status === "pending_finance" ||
      a.status === "approved",
  );

  const usedAmount = paid.reduce((sum, a) => sum + a.amount, 0);
  const pendingAmount = pending.reduce((sum, a) => sum + a.amount, 0);
  const remainingAmount = club.semesterBudget - usedAmount - pendingAmount;

  return {
    clubId: club.id,
    clubName: club.name,
    semesterBudget: club.semesterBudget,
    usedAmount,
    pendingAmount,
    remainingAmount: Math.max(0, remainingAmount),
    usagePercentage: Math.min(
      100,
      Math.round((usedAmount / club.semesterBudget) * 100),
    ),
    totalApplications: clubApps.length,
    paidApplications: paid.length,
    pendingApplications: pending.length,
  };
};

export const getOverviewStatistics = (user: User): ClubStatistics[] => {
  let targetClubs: Club[] = [];

  if (user.role === "finance") {
    targetClubs = [...clubs];
  } else if (user.role === "president" && user.clubId) {
    const c = findClubById(user.clubId);
    if (c) targetClubs = [c];
  } else if (user.role === "teacher") {
    targetClubs = clubs.filter((c) => c.teacherId === user.id);
  }

  return targetClubs.map((c) => getClubStatistics(c));
};

export const updateClubStats = (clubId: string): void => {
  const club = findClubById(clubId);
  if (!club) return;

  const paid = applications.filter(
    (a) => a.clubId === clubId && a.status === "paid",
  );
  const pending = applications.filter(
    (a) =>
      a.clubId === clubId &&
      (a.status === "pending_teacher" ||
        a.status === "pending_finance" ||
        a.status === "approved"),
  );

  club.usedAmount = paid.reduce((sum, a) => sum + a.amount, 0);
  club.pendingAmount = pending.reduce((sum, a) => sum + a.amount, 0);
};

export const filterApplicationsByUser = (
  user: User,
): ReimbursementApplication[] => {
  if (user.role === "finance") {
    return [...applications];
  }
  if (user.role === "teacher") {
    return applications.filter((a) => a.teacherId === user.id);
  }
  if (user.role === "president") {
    return applications.filter((a) => a.presidentId === user.id);
  }
  return [];
};

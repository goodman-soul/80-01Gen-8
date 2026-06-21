import type {
  User,
  Club,
  ReimbursementApplication,
  Invoice,
} from "../../shared/types.js";

const now = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return iso(d);
};

export const users: User[] = [
  {
    id: "user_president_01",
    username: "president01",
    name: "张明",
    role: "president",
    clubId: "club_cs",
  },
  {
    id: "user_teacher_01",
    username: "teacher01",
    name: "李老师",
    role: "teacher",
  },
  {
    id: "user_finance_01",
    username: "finance01",
    name: "王会计",
    role: "finance",
  },
];

export const passwords: Record<string, string> = {
  president01: "123456",
  teacher01: "123456",
  finance01: "123456",
};

export const clubs: Club[] = [
  {
    id: "club_cs",
    name: "计算机协会",
    description: "推广计算机技术，举办编程比赛、技术讲座等活动",
    semesterBudget: 50000,
    usedAmount: 12500,
    pendingAmount: 3000,
    teacherId: "user_teacher_01",
  },
  {
    id: "club_english",
    name: "英语俱乐部",
    description: "提供英语学习交流平台，举办英语角、演讲比赛",
    semesterBudget: 30000,
    usedAmount: 8000,
    pendingAmount: 0,
    teacherId: "user_teacher_01",
  },
  {
    id: "club_art",
    name: "艺术社",
    description: "培养学生艺术兴趣，举办画展、手工创作活动",
    semesterBudget: 25000,
    usedAmount: 5000,
    pendingAmount: 1500,
    teacherId: "user_teacher_01",
  },
  {
    id: "club_sports",
    name: "篮球协会",
    description: "组织篮球训练、校内联赛和校际友谊赛",
    semesterBudget: 40000,
    usedAmount: 15000,
    pendingAmount: 2000,
    teacherId: "user_teacher_01",
  },
];

const makeFile = (
  id: string,
  name: string,
  type: "budget" | "invoice" | "payment",
) => ({
  id,
  name,
  type,
  url: `https://picsum.photos/seed/${id}/800/600`,
  size: 102400 + Math.floor(Math.random() * 409600),
});

export const applications: ReimbursementApplication[] = [
  {
    id: "app_001",
    clubId: "club_cs",
    activityName: "春季编程马拉松",
    activityDate: daysAgo(20).slice(0, 10),
    activityDescription: "为期36小时的编程比赛，面向全校学生开放，提供场地、设备和奖品。",
    amount: 5000,
    presidentId: "user_president_01",
    teacherId: "user_teacher_01",
    status: "paid",
    budgetFiles: [makeFile("f_budget_001", "编程马拉松预算表.xlsx", "budget")],
    invoices: [
      {
        id: "inv_001",
        invoiceNumber: "FP2026001001",
        amount: 3000,
        applicationId: "app_001",
        uploadedAt: daysAgo(18),
      },
      {
        id: "inv_002",
        invoiceNumber: "FP2026001002",
        amount: 2000,
        applicationId: "app_001",
        uploadedAt: daysAgo(18),
      },
    ],
    paymentFiles: [makeFile("f_pay_001", "奖品采购付款截图.png", "payment")],
    createdAt: daysAgo(25),
    updatedAt: daysAgo(10),
    paidAt: daysAgo(10),
  },
  {
    id: "app_002",
    clubId: "club_cs",
    activityName: "AI技术讲座",
    activityDate: daysAgo(10).slice(0, 10),
    activityDescription: "邀请业界专家分享人工智能前沿技术，需支付讲师费和场地布置费。",
    amount: 4500,
    presidentId: "user_president_01",
    teacherId: "user_teacher_01",
    status: "paid",
    budgetFiles: [makeFile("f_budget_002", "AI讲座预算.pdf", "budget")],
    invoices: [
      {
        id: "inv_003",
        invoiceNumber: "FP2026002001",
        amount: 4500,
        applicationId: "app_002",
        uploadedAt: daysAgo(9),
      },
    ],
    paymentFiles: [makeFile("f_pay_002", "讲师费转账截图.jpg", "payment")],
    createdAt: daysAgo(15),
    updatedAt: daysAgo(5),
    paidAt: daysAgo(5),
  },
  {
    id: "app_003",
    clubId: "club_cs",
    activityName: "社团招新物资采购",
    activityDate: daysAgo(5).slice(0, 10),
    activityDescription: "秋季招新所需的宣传册、横幅、小礼品等物资采购费用。",
    amount: 3000,
    presidentId: "user_president_01",
    teacherId: "user_teacher_01",
    status: "pending_finance",
    budgetFiles: [makeFile("f_budget_003", "招新物资预算表.xlsx", "budget")],
    invoices: [
      {
        id: "inv_004",
        invoiceNumber: "FP2026003001",
        amount: 3000,
        applicationId: "app_003",
        uploadedAt: daysAgo(4),
      },
    ],
    paymentFiles: [makeFile("f_pay_003", "采购付款截图.png", "payment")],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(2),
  },
  {
    id: "app_004",
    clubId: "club_cs",
    activityName: "月度技术分享会",
    activityDate: daysAgo(2).slice(0, 10),
    activityDescription: "社团内部技术分享会，含茶歇和场地费用。",
    amount: 1500,
    presidentId: "user_president_01",
    teacherId: "user_teacher_01",
    status: "rejected_teacher",
    budgetFiles: [makeFile("f_budget_004", "分享会预算.docx", "budget")],
    invoices: [
      {
        id: "inv_005",
        invoiceNumber: "FP2026004001",
        amount: 1500,
        applicationId: "app_004",
        uploadedAt: daysAgo(1),
      },
    ],
    paymentFiles: [],
    teacherRejectReason:
      "发票内容不够详细，请补充具体购买了哪些茶歇物品，并附上消费清单。另外建议将活动预算明细拆解得更清楚一些，方便财务审核~",
    createdAt: daysAgo(3),
    updatedAt: iso(now),
  },
  {
    id: "app_005",
    clubId: "club_art",
    activityName: "春季艺术画展",
    activityDate: daysAgo(8).slice(0, 10),
    activityDescription: "校园春季艺术画展，包括画框、展板、宣传物料费用。",
    amount: 5000,
    presidentId: "user_president_01",
    teacherId: "user_teacher_01",
    status: "pending_teacher",
    budgetFiles: [makeFile("f_budget_005", "画展预算.xlsx", "budget")],
    invoices: [
      {
        id: "inv_006",
        invoiceNumber: "FP2026005001",
        amount: 5000,
        applicationId: "app_005",
        uploadedAt: daysAgo(7),
      },
    ],
    paymentFiles: [makeFile("f_pay_005", "画材采购截图.jpg", "payment")],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
];

export const getInvoices = (): Invoice[] =>
  applications.flatMap((a) => a.invoices);

export const findUserByUsername = (username: string): User | undefined =>
  users.find((u) => u.username === username);

export const findClubById = (id: string): Club | undefined =>
  clubs.find((c) => c.id === id);

export const findApplicationById = (
  id: string,
): ReimbursementApplication | undefined =>
  applications.find((a) => a.id === id);

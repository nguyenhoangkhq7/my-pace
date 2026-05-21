// ── API response types (legacy — keep for backward compat) ───────────────────

export type BoardSummary = {
  id: number;
  name: string;
};

export type TaskContext = {
  name: string;
  colorCode: string;
};

export type Task = {
  id: number;
  title: string;
  position: number;
  context: TaskContext | null;
  dueDate: string | null; // ISO date string
  priority: string | null;
  energyRequired: string | null;
  estimatedMinutes: number | null;
};

export type BoardColumn = {
  id: number;
  name: string;
  position: number;
  tasks: Task[];
};

export type Board = {
  id: number;
  name: string;
  boardColumns: BoardColumn[];
};

// ── Priority & Energy enums (aligned to V1 SQL migration) ───────────────────

export type Priority = 1 | 2 | 3 | 4; // LOW, MEDIUM, HIGH, URGENT
export type EnergyLevel = 1 | 2 | 3 | 4 | 5; // VERY_LOW → INTENSE
export type TaskStatus = "TODO" | "DOING" | "IN_REVIEW" | "DONE";

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Urgent",
};

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-l-slate-500" },
  2: { bg: "bg-blue-500/20", text: "text-blue-200", border: "border-l-blue-400" },
  3: { bg: "bg-amber-500/20", text: "text-amber-200", border: "border-l-amber-400" },
  4: { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-l-rose-500" },
};

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  1: "Very Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Intense",
};

// ── Category (was "context" in old schema) ──────────────────────────────────

export type Category = {
  id: number;
  name: string;
  colorCode: string;
  preferredStartTime: string | null; // "HH:mm"
  preferredEndTime: string | null;
};

// ── Category badge color mapping ────────────────────────────────────────────

export const CATEGORY_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Work: { bg: "bg-blue-500/20", text: "text-blue-200" },
  Personal: { bg: "bg-emerald-500/20", text: "text-emerald-200" },
  Learning: { bg: "bg-violet-500/20", text: "text-violet-200" },
  Health: { bg: "bg-teal-500/20", text: "text-teal-200" },
};

// ── TaskItem (aligned to V1 migration) ──────────────────────────────────────

export type TaskItem = {
  id: number;
  categoryId: number | null;
  category: Category | null;
  parentId: number | null;
  title: string;
  description: string | null;
  position: number;
  status: TaskStatus;
  isDone: boolean;
  priority: Priority;
  energyRequired: EnergyLevel;
  estimatedMinutes: number | null;
  dueDate: string | null; // ISO datetime
  createdAt: string;
};

// ── Event ───────────────────────────────────────────────────────────────────

export type CalendarEvent = {
  id: number;
  title: string;
  description: string | null;
  startAt: string; // ISO datetime
  endAt: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  color: string;
};

// ── Matrix quadrant type ────────────────────────────────────────────────────

export type MatrixQuadrantType =
  | "do-now" // Urgent + Important
  | "schedule" // Not Urgent + Important
  | "delegate" // Urgent + Not Important
  | "eliminate"; // Not Urgent + Not Important

// ── Today stats ─────────────────────────────────────────────────────────────

export type TodayStats = {
  total: number;
  completed: number;
  overdue: number;
};

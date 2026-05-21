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
  isImportant: boolean;
  energyRequired: EnergyLevel | null;
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

// ── Energy enum (aligned to V1 SQL migration) ───────────────────────────────

export type EnergyLevel = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "DOING" | "IN_REVIEW" | "DONE";

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const ENERGY_COLORS: Record<EnergyLevel, { bg: string; text: string }> = {
  LOW: { bg: "bg-emerald-500/20", text: "text-emerald-200" },
  MEDIUM: { bg: "bg-amber-500/20", text: "text-amber-200" },
  HIGH: { bg: "bg-rose-500/20", text: "text-rose-300" },
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
  isImportant: boolean;
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

export type ScheduledTask = {
  id: number;
  taskId: number;
  taskTitle: string;
  categoryName: string;
  categoryColor: string;
  startTime: string;
  endTime: string;
  task: TaskItem;
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

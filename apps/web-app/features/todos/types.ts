// ── API response types ───────────────────────────────────────────────────────

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
  dueDate: string | null;        // ISO date string
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

export interface QuickAddResult {
  title: string;
  estimatedMinutes: number | null;
  isUrgent: boolean;
  isImportant: boolean;
  dueDate: string | null;
  categoryId: string | null;
  goalId: string | null;
  notes: string | null;
  checklists: QuickAddChecklist[] | null;
}

export interface QuickAddChecklist {
  title: string;
  isCompleted: boolean;
  orderIndex: number;
}

export type QuickAddStatus = "idle" | "loading" | "preview" | "creating" | "error";

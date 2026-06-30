export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  userId: string;
  goalId?: string;
  categoryId?: string;
  category?: Category;
  title: string;
  estimatedMinutes: number;
  actualMinutes: number;
  isUrgent: boolean;
  isImportant: boolean;
  status: 'Backlog' | 'Picked for Today' | 'Done';
  dueDate?: string;
  notes?: string;
}

export interface DailyPlanTask {
  id: string;
  dailyPlanId: string;
  task: Task;
  isMit: boolean;
  sortOrder: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  planDate: string;
  availableMinutes: number;
  isConfirmed: boolean;
  tasks: DailyPlanTask[];
}

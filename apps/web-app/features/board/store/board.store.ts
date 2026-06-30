import { create } from "zustand";
import { Task, DailyPlan, Category, TaskTimeBlock } from "../types";
import { boardApi } from "../api/board.api";
import { useGoalStore } from "@/features/goal/store/goal.store";

interface BoardState {
  tasks: Task[];
  categories: Category[];
  selectedFilterId: string | null;
  dailyPlanToday: DailyPlan | null;
  dailyPlanTomorrow: DailyPlan | null;
  timeBlocks: TaskTimeBlock[];
  isStarted: boolean;
  isLoading: boolean;
  isPlanningMode: boolean;
  planningTarget: 'today' | 'tomorrow' | null;
  plannedTaskIds: string[];

  fetchTasks: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createCategory: (category: Partial<Category>) => Promise<Category>;
  setFilter: (categoryId: string | null) => void;
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;

  fetchDailyPlanToday: (date: string) => Promise<void>;
  fetchDailyPlanTomorrow: (date: string) => Promise<void>;

  setPlanningMode: (isPlanning: boolean, target?: 'today' | 'tomorrow') => void;
  addPlannedTaskLocally: (task: Task) => void;
  removePlannedTaskLocally: (taskId: string) => void;

  savePlan: (date: string, availableMinutes: number, target: 'today' | 'tomorrow') => Promise<void>;
  confirmPlan: (date: string) => Promise<void>;
  reviewDailyPlan: (date: string) => Promise<void>;
  cancelPlan: (date: string, target: 'today' | 'tomorrow') => Promise<void>;
  toggleTaskDone: (date: string, planTaskId: string) => Promise<void>;
  saveTimeBlocks: (blocks: Omit<TaskTimeBlock, 'id'>[]) => Promise<TaskTimeBlock[]>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tasks: [],
  categories: [],
  selectedFilterId: null,
  dailyPlanToday: null,
  dailyPlanTomorrow: null,
  timeBlocks: [],
  isStarted: false,
  isLoading: false,
  isPlanningMode: false,
  planningTarget: null,
  plannedTaskIds: [],

  setFilter: (categoryId) => set({ selectedFilterId: categoryId }),

  fetchCategories: async () => {
    try {
      const res = await boardApi.getCategories();
      set({ categories: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  createCategory: async (category) => {
    const res = await boardApi.createCategory(category);
    set(state => ({ categories: [...state.categories, res.data] }));
    return res.data;
  },

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const res = await boardApi.getTasks();
      set({ tasks: res.data });
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (task) => {
    const res = await boardApi.createTask(task);
    set(state => ({ tasks: [...state.tasks, res.data] }));
    return res.data;
  },

  updateTask: async (id, task) => {
    const res = await boardApi.updateTask(id, task);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? res.data : t)
    }));
    return res.data;
  },

  fetchDailyPlanToday: async (date) => {
    set({ isLoading: true });
    try {
      const res = await boardApi.getDailyPlan(date);
      set({
        dailyPlanToday: res.data,
        // Sync timeBlocks from plan response so calendar page can use them
        timeBlocks: res.data?.timeBlocks ?? [],
        isStarted: res.data?.isConfirmed ?? false,
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDailyPlanTomorrow: async (date) => {
    try {
      const res = await boardApi.getDailyPlan(date);
      set({ dailyPlanTomorrow: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  setPlanningMode: (isPlanning, target = 'today') => {
    set({ isPlanningMode: isPlanning, planningTarget: isPlanning ? target : null });
    if (isPlanning) {
      const plan = target === 'today' ? get().dailyPlanToday : get().dailyPlanTomorrow;
      if (plan && plan.tasks) {
        set({ plannedTaskIds: plan.tasks.map(t => t.task.id) });
      } else {
        set({ plannedTaskIds: [] });
      }
    }
  },

  addPlannedTaskLocally: (task) => {
    set(state => {
      if (!state.plannedTaskIds.includes(task.id)) {
        return { plannedTaskIds: [...state.plannedTaskIds, task.id] };
      }
      return state;
    });
  },

  removePlannedTaskLocally: (taskId) => {
    set(state => ({
      plannedTaskIds: state.plannedTaskIds.filter(id => id !== taskId)
    }));
  },

  savePlan: async (date, availableMinutes, target) => {
    set({ isLoading: true });
    try {
      const { plannedTaskIds } = get();
      const planTasks = plannedTaskIds.map((id, index) => {
        const task = get().tasks.find(t => t.id === id);
        return {
          taskId: id,
          isMit: task ? task.isImportant : false,
          sortOrder: index,
        };
      });
      
      const res = await boardApi.planMyDay({
        planDate: date,
        availableMinutes,
        tasks: planTasks
      });
      
      if (target === 'today') {
        set({ dailyPlanToday: res.data, isPlanningMode: false, planningTarget: null, isStarted: res.data?.isConfirmed ?? false });
      } else {
        set({ dailyPlanTomorrow: res.data, isPlanningMode: false, planningTarget: null });
      }
      
      await get().fetchTasks(); // refresh backlog
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  confirmPlan: async (date) => {
    set({ isLoading: true });
    try {
      const res = await boardApi.confirmPlan(date);
      set({ dailyPlanToday: res.data, isStarted: true });
    } catch (err) {
      console.error("Failed to confirm plan", err);
    } finally {
      set({ isLoading: false });
    }
  },

  reviewDailyPlan: async (date) => {
    set({ isLoading: true });
    try {
      const res = await boardApi.reviewPlan(date);
      set({ dailyPlanToday: res.data });
    } catch (err) {
      console.error("Failed to review plan", err);
    } finally {
      set({ isLoading: false });
    }
  },

  cancelPlan: async (date, target) => {
    set({ isLoading: true });
    try {
      await boardApi.cancelPlan(date);
      if (target === 'today') {
        set({ dailyPlanToday: null, isPlanningMode: false, planningTarget: null, plannedTaskIds: [], timeBlocks: [], isStarted: false });
      } else {
        set({ dailyPlanTomorrow: null, isPlanningMode: false, planningTarget: null, plannedTaskIds: [] });
      }
      await get().fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleTaskDone: async (date, planTaskId) => {
    try {
      await boardApi.toggleTaskDone(planTaskId);
      await get().fetchDailyPlanToday(date);
      await get().fetchTasks();
      // Sync goals to update progress
      useGoalStore.getState().fetchGoals().catch(console.error);
    } catch (err) {
      console.error(err);
    }
  },

  saveTimeBlocks: async (blocks) => {
    const plan = get().dailyPlanToday;
    if (!plan) throw new Error("No active plan");
    const res = await boardApi.saveTimeBlocks({ dailyPlanId: plan.id, blocks });
    set({ timeBlocks: res.data });
    return res.data;
  },
}));

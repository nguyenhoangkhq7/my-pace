import { create } from "zustand";
import { Task, DailyPlan } from "../types";
import { boardApi } from "../api/board.api";

interface BoardState {
  tasks: Task[];
  dailyPlanToday: DailyPlan | null;
  dailyPlanTomorrow: DailyPlan | null;
  isLoading: boolean;
  isPlanningMode: boolean;
  plannedTaskIds: string[];

  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  
  fetchDailyPlanToday: (date: string) => Promise<void>;
  fetchDailyPlanTomorrow: (date: string) => Promise<void>;
  
  setPlanningMode: (isPlanning: boolean) => void;
  addPlannedTaskLocally: (task: Task) => void;
  removePlannedTaskLocally: (taskId: string) => void;
  
  savePlan: (date: string, availableMinutes: number) => Promise<void>;
  cancelPlanToday: (date: string) => Promise<void>;
  toggleTaskDone: (date: string, planTaskId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tasks: [],
  dailyPlanToday: null,
  dailyPlanTomorrow: null,
  isLoading: false,
  isPlanningMode: false,
  plannedTaskIds: [],

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
      set({ dailyPlanToday: res.data });
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

  setPlanningMode: (isPlanning) => {
    set({ isPlanningMode: isPlanning });
    if (isPlanning) {
      // Initialize plannedTaskIds from current today's plan
      const plan = get().dailyPlanToday;
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

  savePlan: async (date, availableMinutes) => {
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
      set({ dailyPlanToday: res.data, isPlanningMode: false });
      await get().fetchTasks(); // refresh backlog
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  cancelPlanToday: async (date) => {
    set({ isLoading: true });
    try {
      await boardApi.cancelPlan(date);
      set({ dailyPlanToday: null, isPlanningMode: false, plannedTaskIds: [] });
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
    } catch (err) {
      console.error(err);
    }
  }
}));

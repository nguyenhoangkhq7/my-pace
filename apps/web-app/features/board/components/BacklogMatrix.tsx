import { useBoardStore } from "../store/board.store";
import { Task } from "../types";
import { TaskFormModal } from "./TaskFormModal";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, FilterIcon, Calendar01Icon, Folder01Icon, Target02Icon, PlayIcon, PauseIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useAvailableTimeStore } from "../../available-time/store/available-time.store";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { GoalDetailModal } from "@/features/goal/components/GoalDetailModal";
import { Goal } from "@/features/goal/types";

export function BacklogMatrix() {
  const { tasks, isPlanningMode, plannedTaskIds, addPlannedTaskLocally, removePlannedTaskLocally, createTask, updateTask, isStarted, planningTarget, dailyPlanTomorrow } = useBoardStore();
  const { dataToday, dataTomorrow } = useAvailableTimeStore();
  const { goals, fetchGoals } = useGoalStore();
  const availableTimeData = planningTarget === 'today' ? dataToday : dataTomorrow;
  const availableMinutes = availableTimeData?.availableMinutes || 0;
  const [activeTab, setActiveTab] = useState<'tasks' | 'goals'>('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | undefined>(undefined);
  const [prefilledGoalForTask, setPrefilledGoalForTask] = useState<string | undefined>(undefined);

  const [isGoalDetailModalOpen, setIsGoalDetailModalOpen] = useState(false);
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateTask = async (data: Partial<Task>) => {
    let newTask;
    if (editingTask) {
      newTask = await updateTask(editingTask.id, data);
    } else {
      newTask = await createTask(data);
      if (isPlanningMode && newTask) {
        if (newTask.estimatedMinutes) {
          checkTimeLimit(newTask.estimatedMinutes);
          addPlannedTaskLocally(newTask);
        }
      }
    }
    setIsModalOpen(false);
    setEditingTask(undefined);
    setPrefilledGoalForTask(undefined);
  };

  const handleGoalClick = (goal: Goal) => {
    if (goal.goalType === 'Binary') {
      setSelectedGoalForDetail(goal);
      setIsGoalDetailModalOpen(true);
      return;
    }

    if (isPlanningMode) {
      const isTargetStarted = planningTarget === 'today' ? isStarted : (dailyPlanTomorrow?.isConfirmed ?? false);
      if (isTargetStarted) {
        toast.error("Kế hoạch đã chốt và đang thực thi, không thể chỉnh sửa.");
        return;
      }
      setPrefilledGoalForTask(goal.id);
      setIsModalOpen(true);
    } else {
      toast.info("Chỉ có thể tạo Task từ Goal trong chế độ Lập kế hoạch.");
    }
  };

  const checkTimeLimit = (newEstimatedMinutes: number) => {
    const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
    const usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
      
    if (usedTime + newEstimatedMinutes > availableMinutes) {
      toast.warning("Task này vượt quá thời gian trống còn lại trong ngày!");
    }
  };

  const handleTaskClick = (task: Task) => {
    if (isPlanningMode) {
      const isTargetStarted = planningTarget === 'today' ? isStarted : (dailyPlanTomorrow?.isConfirmed ?? false);
      if (isTargetStarted) {
        toast.error("Kế hoạch đã chốt và đang thực thi, không thể chỉnh sửa.");
        return;
      }
      if (plannedTaskIds.includes(task.id)) {
        removePlannedTaskLocally(task.id);
      } else {
        if (!task.estimatedMinutes) {
          setRequireDurationForTask(task);
        } else {
          checkTimeLimit(task.estimatedMinutes);
          addPlannedTaskLocally(task);
        }
      }
    } else {
      setEditingTask(task);
      setIsModalOpen(true);
    }
  };

  const handleMissingDurationSubmit = async (data: Partial<Task>) => {
    if (requireDurationForTask) {
      const updatedTask = await updateTask(requireDurationForTask.id, data);
      if (updatedTask && updatedTask.estimatedMinutes) {
        checkTimeLimit(updatedTask.estimatedMinutes);
      }
      addPlannedTaskLocally(updatedTask);
      setRequireDurationForTask(undefined);
    }
  };

  const renderQuadrant = (title: string, isUrgent: boolean, isImportant: boolean, colorClass: string) => {
    let qTasks = tasks.filter(t => 
      t.status === "Backlog" && 
      t.isUrgent === isUrgent && 
      t.isImportant === isImportant &&
      !(isPlanningMode && plannedTaskIds.includes(t.id))
    );
    
    const { selectedFilterId } = useBoardStore.getState();
    if (selectedFilterId === "goal") {
      qTasks = qTasks.filter(t => !!t.goalId);
    } else if (selectedFilterId && selectedFilterId !== "none") {
      qTasks = qTasks.filter(t => t.categoryId === selectedFilterId);
    }

    qTasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    return (
      <div className="flex flex-col border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
        <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${colorClass} border-b border-slate-800/50 bg-slate-900/50`}>
          {title} <span className="text-slate-500 ml-1">({qTasks.length})</span>
        </div>
        <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[150px]">
          {qTasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => handleTaskClick(task)}
              className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                isPlanningMode && plannedTaskIds.includes(task.id)
                  ? "border-primary bg-primary/10 text-primary-50"
                  : "border-slate-800 bg-slate-950 hover:border-slate-600 hover:bg-slate-900 text-slate-200"
              }`}
            >
              <div className="font-medium line-clamp-2">{task.title}</div>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {task.goalId ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Goal
                  </span>
                ) : task.category ? (
                  <span 
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                    style={{ 
                      backgroundColor: `${task.category.color}15`, 
                      color: task.category.color,
                      borderColor: `${task.category.color}30`
                    }}
                  >
                    {task.category.name}
                  </span>
                ) : null}

                {task.dueDate && (
                  <span className="inline-flex items-center text-[10px] text-slate-400">
                    <HugeiconsIcon icon={Calendar01Icon} size={12} className="mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                
                {task.estimatedMinutes > 0 && (
                  <div className="text-xs text-slate-500">{task.estimatedMinutes}m</div>
                )}
              </div>
              
              <TaskCardChecklist task={task} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'tasks' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            onClick={() => setActiveTab('tasks')}
          >
            Eisenhower Matrix
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'goals' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            onClick={() => setActiveTab('goals')}
          >
            Goal Backlog
          </button>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'tasks' && (
            <Select 
              value={useBoardStore.getState().selectedFilterId || "none"} 
              onValueChange={(val) => useBoardStore.getState().setFilter(val === "none" ? null : val)}
            >
              <SelectTrigger className="h-8 border-slate-800 bg-slate-950 text-slate-300 w-[140px]">
                <div className="flex items-center">
                  <HugeiconsIcon icon={FilterIcon} size={16} className="mr-2" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                <SelectItem value="none">All Tasks</SelectItem>
                <SelectItem value="goal">Goal</SelectItem>
                {useBoardStore.getState().categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white" onClick={() => { setEditingTask(undefined); setIsModalOpen(true); }}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
          {renderQuadrant("Q1: Do First", true, true, "text-red-400")}
          {renderQuadrant("Q2: Schedule", false, true, "text-blue-400")}
          {renderQuadrant("Q3: Delegate", true, false, "text-yellow-400")}
          {renderQuadrant("Q4: Eliminate", false, false, "text-slate-400")}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 p-1">
          {goals.filter(g => g.status === 'In Progress' && !g.parentGoalId).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
              <HugeiconsIcon icon={Target02Icon} size={32} className="mb-2 opacity-50" />
              <p>Không có Goal nào đang thực thi (In Progress).</p>
            </div>
          ) : (
            goals.filter(g => g.status === 'In Progress' && !g.parentGoalId).map(goal => (
              <div 
                key={goal.id}
                onClick={() => handleGoalClick(goal)}
                className={`p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-primary/50 cursor-pointer transition-all flex flex-col gap-2 ${isPlanningMode ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-70'}`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-100">{goal.title}</h4>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {goal.goalType === 'Binary' && <HugeiconsIcon icon={Folder01Icon} size={10} className="inline mr-1" />}
                      {goal.goalType === 'Binary' ? 'Dự án' : goal.goalType === 'Time-boxed' ? 'Thói quen' : 'Mục tiêu'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.round(goal.progressPct || 0)}%` }} 
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium w-8 text-right">
                    {Math.round(goal.progressPct || 0)}%
                  </span>
                </div>
                
                {isPlanningMode && (
                  <div className="text-[10px] text-primary/80 mt-1 flex items-center">
                    <HugeiconsIcon icon={PlusSignIcon} size={10} className="mr-1" />
                    {goal.goalType === 'Binary' ? 'Bấm để xem chi tiết' : 'Bấm để tạo Task'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <TaskFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTask(undefined); setPrefilledGoalForTask(undefined); }} 
        onSubmit={handleCreateTask}
        initialData={editingTask}
        prefilledGoalId={prefilledGoalForTask}
        requireDuration={!!prefilledGoalForTask}
        isUrgent={!!prefilledGoalForTask ? false : undefined}
        isImportant={!!prefilledGoalForTask ? true : undefined}
      />

      <TaskFormModal 
        isOpen={!!requireDurationForTask} 
        onClose={() => setRequireDurationForTask(undefined)} 
        onSubmit={handleMissingDurationSubmit}
        initialData={requireDurationForTask}
        requireDuration={true}
      />

      <GoalDetailModal 
        isOpen={isGoalDetailModalOpen} 
        onOpenChange={setIsGoalDetailModalOpen} 
        goal={selectedGoalForDetail} 
      />
    </div>
  );
}

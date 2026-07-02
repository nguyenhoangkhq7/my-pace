import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Goal } from "../types";
import { Task } from "@/features/board/types";
import { useBoardStore } from "@/features/board/store/board.store";
import { useGoalStore } from "../store/goal.store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Calendar01Icon, Time02Icon, PlusSignIcon, Folder01Icon, ArrowDown01Icon, ArrowRight01Icon, InboxIcon, Archive02Icon } from "@hugeicons/core-free-icons";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { GoalFormModal } from "./GoalFormModal";
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GoalDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

export function GoalDetailModal({ isOpen, onOpenChange, goal }: GoalDetailModalProps) {
  const { tasks, updateTask } = useBoardStore();
  const { goals, updateGoal } = useGoalStore();
  
  const [isSubgoalModalOpen, setIsSubgoalModalOpen] = useState(false);
  const [activeParentGoalId, setActiveParentGoalId] = useState<string | undefined>(undefined);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  const [isEditingProject, setIsEditingProject] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsEditingProject(false);
    }
  }, [isOpen]);

  const goalTasks = useMemo(() => {
    if (!goal) return [];
    return tasks.filter((t) => t.goalId === goal.id);
  }, [tasks, goal]);

  const subgoals = useMemo(() => {
    if (!goal) return [];
    return goals.filter((g) => g.parentGoalId === goal.id);
  }, [goals, goal]);

  const weeklyStats = useMemo(() => {
    if (!goal || goal.goalType === 'Binary') return { chartData: [], totalWeeklyMinutes: 0, daysCompleted: 0, totalWeeklyCount: 0 };
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    let totalWeeklyMinutes = 0;
    let daysCompleted = 0;
    let totalWeeklyCount = 0;

    const chartData = days.map((day) => {
      const tasksOnDay = goalTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day) && t.status === 'Done');
      const minutes = tasksOnDay.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
      const count = tasksOnDay.length;
      if (minutes > 0) totalWeeklyMinutes += minutes;
      if (count > 0) {
        totalWeeklyCount += count;
        daysCompleted += 1;
      }
      return { name: format(day, "EEE"), minutes, count };
    });
    return { chartData, totalWeeklyMinutes, daysCompleted, totalWeeklyCount };
  }, [goalTasks, goal]);

  if (!goal) return null;

  const handleOpenCreateSubgoal = (parentId: string) => {
    setActiveParentGoalId(parentId);
    setIsSubgoalModalOpen(true);
  };


  const handleAddToBacklog = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'Backlog' });
      toast.success("Đã chuyển Task vào Backlog!");
    } catch (e) {
      toast.error("Lỗi khi chuyển Task.");
    }
  };

  const handleMoveToIcebox = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'Icebox' });
      toast.success("Đã trả Task về Icebox!");
    } catch (e) {
      toast.error("Lỗi khi chuyển Task.");
    }
  };

  const TaskList = ({ taskList, gId, gStatus }: { taskList: Task[], gId: string, gStatus?: string }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const handleInlineCreate = async () => {
      if (!newTaskTitle.trim()) {
        setIsCreating(false);
        return;
      }
      try {
        await useBoardStore.getState().createTask({
          title: newTaskTitle,
          goalId: gId,
          status: 'Icebox',
          estimatedMinutes: 0,
          isImportant: true,
          isUrgent: false
        } as any);
        toast.success("Đã tạo Task!");
        setNewTaskTitle("");
        setIsCreating(false);
      } catch (e) {
        toast.error("Lỗi khi tạo Task");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleInlineCreate();
      if (e.key === 'Escape') {
        setIsCreating(false);
        setNewTaskTitle("");
      }
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks</h4>
          {isEditingProject && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 text-xs text-primary hover:text-primary/80 px-2" 
              onClick={() => setIsCreating(true)}
              disabled={gStatus === 'Freeze' || gStatus === 'Archived'}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={12} className="mr-1" />
              Task
            </Button>
          )}
        </div>
        <div className="space-y-1.5">
          {taskList.length === 0 && !isCreating ? (
            <p className="text-xs text-slate-600 italic">Chưa có Task nào.</p>
          ) : (
            taskList.map(t => (
              <div 
                key={t.id} 
                className="p-2.5 bg-slate-900/60 rounded-md border border-slate-800/80 flex items-center justify-between group transition-colors hover:border-slate-700 cursor-pointer"
                onClick={() => {
                  setSelectedTask(t);
                  setIsTaskModalOpen(true);
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <HugeiconsIcon 
                    icon={CheckmarkCircle01Icon} 
                    size={16} 
                    className={cn("shrink-0", t.status === 'Done' ? "text-emerald-500" : "text-slate-600")} 
                  />
                  <span className={cn("text-sm truncate", t.status === 'Done' ? "text-slate-500 line-through" : "text-slate-300")}>
                    {t.title}
                  </span>
                  
                  {t.status === 'Icebox' && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Icebox
                    </span>
                  )}
                  {t.status === 'Backlog' && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                      Backlog
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {t.status === 'Icebox' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-[10px] border-cyan-800/50 text-cyan-400 hover:bg-cyan-950 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); handleAddToBacklog(t); }}
                    >
                      <HugeiconsIcon icon={InboxIcon} size={10} className="mr-1" />
                      Đưa vào Backlog
                    </Button>
                  )}
                  {t.status === 'Backlog' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-[10px] border-slate-700 text-slate-400 hover:bg-slate-800 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); handleMoveToIcebox(t); }}
                    >
                      <HugeiconsIcon icon={Archive02Icon} size={10} className="mr-1" />
                      Trả về Icebox
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          {isCreating && (
            <div className="p-2.5 bg-slate-900/60 rounded-md border border-primary/50 flex items-center">
              <input
                autoFocus
                className="bg-transparent border-none outline-none text-sm text-slate-200 w-full"
                placeholder="Nhập tên task và nhấn Enter..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleInlineCreate}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const SubgoalAccordion = ({ subgoal, level }: { subgoal: Goal; level: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const childrenSubgoals = goals.filter(g => g.parentGoalId === subgoal.id);
    const childrenTasks = tasks.filter(t => t.goalId === subgoal.id);

    return (
      <div className="border border-slate-800/60 rounded-lg bg-slate-900/20 overflow-hidden mb-2">
        <div 
          className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon} size={14} className="text-slate-500" />
            <HugeiconsIcon icon={Folder01Icon} size={14} className={subgoal.status === 'Done' ? "text-emerald-500" : "text-indigo-400"} />
            <span className={cn("text-sm font-medium", subgoal.status === 'Done' ? "text-slate-500 line-through" : "text-slate-200")}>
              {subgoal.title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">{Math.round(subgoal.progressPct || 0)}%</span>
          </div>
        </div>
        
        {isOpen && (
          <div className="p-3 border-t border-slate-800/50 bg-slate-950/30 space-y-4 ml-2 border-l-2 border-l-slate-800">
            <TaskList taskList={childrenTasks} gId={subgoal.id} gStatus={subgoal.status} />
            
            {level < 3 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dự án con (Subgoals)</h4>
                  {isEditingProject && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs text-primary hover:text-primary/80 px-2" 
                      onClick={() => handleOpenCreateSubgoal(subgoal.id)}
                      disabled={subgoal.status === 'Freeze' || subgoal.status === 'Archived'}
                    >
                      <HugeiconsIcon icon={PlusSignIcon} size={12} className="mr-1" />
                      Subgoal
                    </Button>
                  )}
                </div>
                {childrenSubgoals.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">Chưa có Dự án con nào.</p>
                ) : (
                  childrenSubgoals.map(child => (
                    <SubgoalAccordion key={child.id} subgoal={child} level={level + 1} />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderProjectDetail = () => {
    const totalItems = goalTasks.length + subgoals.length;
    const doneTasks = goalTasks.filter(t => t.status === 'Done').length;
    const doneSubgoals = subgoals.filter(g => g.status === 'Done').length;
    const doneItems = doneTasks + doneSubgoals;
    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Tiến độ Dự án</h3>
            <div className="text-2xl font-bold text-slate-100">{doneItems} / {totalItems} <span className="text-sm font-normal text-slate-500">Mục</span></div>
          </div>
          <div className="text-right">
            <h3 className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Hoàn thành</h3>
            <div className="text-2xl font-bold text-primary">{pct}%</div>
          </div>
        </div>
        
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden -mt-2">
          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        {pct === 100 && goal.status !== 'Done' && (
          <div className="flex justify-center mt-2 mb-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white w-full"
              onClick={async () => {
                await updateGoal(goal.id, { status: "Done" });
                toast.success("Chúc mừng bạn đã hoàn thành Dự án!");
              }}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="mr-2" />
              Đánh dấu Hoàn thành Dự án
            </Button>
          </div>
        )}

        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          <TaskList taskList={goalTasks} gId={goal.id} gStatus={goal.status} />

          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-2">
              <h3 className="text-sm font-semibold text-slate-200">Dự án con (Subgoals)</h3>
              {isEditingProject && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-xs text-primary hover:text-primary/80" 
                  onClick={() => handleOpenCreateSubgoal(goal.id)}
                  disabled={goal.status === 'Freeze' || goal.status === 'Archived'}
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} className="mr-1" />
                  + Subgoal
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {subgoals.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Chưa có Dự án con nào.</p>
              ) : (
                subgoals.map(g => (
                  <SubgoalAccordion key={g.id} subgoal={g} level={2} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHabitDetail = () => {
    const targetMinsPerWeek = (goal.timeBoxedGoal?.targetMinutes || 0) * (7 / Math.max(goal.timeBoxedGoal?.periodDays || 1, 1));
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm text-slate-400 mb-1 flex items-center">
              <HugeiconsIcon icon={Time02Icon} size={14} className="mr-1" /> Tổng phút tuần này
            </h3>
            <div className="text-2xl font-bold text-slate-100">{weeklyStats.totalWeeklyMinutes} <span className="text-sm text-slate-500 font-normal">/ {Math.round(targetMinsPerWeek)} ph</span></div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm text-slate-400 mb-1 flex items-center">
              <HugeiconsIcon icon={Calendar01Icon} size={14} className="mr-1" /> Số ngày thực hiện
            </h3>
            <div className="text-2xl font-bold text-slate-100">{weeklyStats.daysCompleted} <span className="text-sm text-slate-500 font-normal">/ 7 ngày</span></div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Biểu đồ thời gian (Tuần này)</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats.chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#38bdf8' }} formatter={(value) => [`${value} phút`, 'Thời gian']} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {weeklyStats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.minutes > 0 ? '#38bdf8' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderTargetDetail = () => (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm text-slate-400 mb-1">Tiến độ chung</h3>
          <div className="text-2xl font-bold text-slate-100">{goal.milestoneGoal?.currentCount || 0} / {goal.milestoneGoal?.targetCount || 0}</div>
        </div>
        <div className="text-right">
          <h3 className="text-sm text-slate-400 mb-1">Tuần này đạt được</h3>
          <div className="text-2xl font-bold text-primary">+{weeklyStats.totalWeeklyCount}</div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Mức độ đạt được (Tuần này)</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats.chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#8b5cf6' }} formatter={(value) => [`${value}`, 'Số lượng']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {weeklyStats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#8b5cf6' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-slate-950 border-slate-800 text-slate-100 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/60 shrink-0 relative">
          <div className="flex items-start justify-between pr-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {goal.goalType === 'Binary' ? 'Dự án (Project)' : goal.goalType === 'Time-boxed' ? 'Thói quen (Habit)' : 'Mục tiêu (Target)'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                  goal.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                  goal.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {goal.status}
                </span>
              </div>
              <DialogTitle className="text-xl">{goal.title}</DialogTitle>
            </div>
            
            {goal.goalType === 'Binary' && (
              <Button
                variant={isEditingProject ? "default" : "outline"}
                size="sm"
                className={cn("h-7 text-xs", isEditingProject ? "bg-primary text-white hover:bg-primary/90" : "border-slate-700 text-slate-300 hover:text-white")}
                onClick={() => setIsEditingProject(!isEditingProject)}
              >
                {isEditingProject ? 'Xong' : 'Chỉnh sửa'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 overflow-y-auto min-h-0 flex-1">
          {goal.goalType === 'Binary' && renderProjectDetail()}
          {goal.goalType === 'Time-boxed' && renderHabitDetail()}
          {goal.goalType === 'Milestone' && renderTargetDetail()}
        </div>
      </DialogContent>
      
      <GoalFormModal 
        isOpen={isSubgoalModalOpen} 
        onOpenChange={setIsSubgoalModalOpen} 
        prefilledParentGoalId={activeParentGoalId} 
      />
      
      {isTaskModalOpen && (
        <TaskFormModal 
          isOpen={isTaskModalOpen} 
          onClose={() => setIsTaskModalOpen(false)} 
          initialData={selectedTask}
        />
      )}
    </Dialog>
  );
}

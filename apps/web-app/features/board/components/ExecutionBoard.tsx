import { useState, useMemo } from "react";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, PlayIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { StartMyDayModal } from "./StartMyDayModal";
import { TaskCardChecklist } from "./TaskCardChecklist";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useRouter } from "next/navigation";

export function ExecutionBoard({ currentDate, tomorrowDate }: { currentDate: string; tomorrowDate: string }) {
  const router = useRouter();
  const { 
    tasks, 
    dailyPlanToday, 
    dailyPlanTomorrow,
    isPlanningMode, 
    planningTarget,
    setPlanningMode, 
    plannedTaskIds, 
    removePlannedTaskLocally,
    savePlan,
    cancelPlan,
    isStarted
  } = useBoardStore();
  
  const { openFocusMode } = useFocusStore();
  const { dataToday, dataTomorrow } = useAvailableTimeStore(s => s);
  const [activeTab, setActiveTab] = useState("today");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isStartMyDayOpen, setIsStartMyDayOpen] = useState(false);

  const currentPlan = activeTab === "today" ? dailyPlanToday : dailyPlanTomorrow;
  const targetDate = activeTab === "today" ? currentDate : tomorrowDate;

  // Time calculations
  const baseAvailable = (activeTab === "today" ? dataToday?.availableMinutes : dataTomorrow?.availableMinutes) || 0;
  
  const currentAvailable = useMemo(() => {
    if (!isPlanningMode) {
      return currentPlan ? currentPlan.availableMinutes : baseAvailable;
    }
    
    // In planning mode, deduct the sum of planned tasks
    const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
    const usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    return Math.max(0, baseAvailable - usedTime);
  }, [isPlanningMode, baseAvailable, currentPlan, plannedTaskIds, tasks]);

  const handleSavePlan = () => {
    savePlan(targetDate, currentAvailable, activeTab as 'today' | 'tomorrow');
  };

  const handleCancelPlan = () => {
    cancelPlan(targetDate, activeTab as 'today' | 'tomorrow');
    setIsCancelModalOpen(false);
  };

  const renderTaskDetails = (task: typeof tasks[0]) => (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
      {task.goalId ? (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Goal
        </span>
      ) : task.category ? (
        <span 
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
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
        <span className="inline-flex items-center text-[10px] text-muted-foreground">
          <HugeiconsIcon icon={Calendar01Icon} size={10} className="mr-1" />
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
      
      {task.estimatedMinutes > 0 && (
        <div className="text-xs text-muted-foreground">{task.estimatedMinutes}m</div>
      )}
      
      <TaskCardChecklist task={task} disabled={currentPlan?.isConfirmed} />
    </div>
  );

  const renderPlanningMode = () => {
    const plannedTasks = plannedTaskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as typeof tasks;
    const mits = plannedTasks.filter(t => t.isImportant);
    const regularTasks = plannedTasks.filter(t => !t.isImportant);

    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="text-xs text-primary/80 font-semibold uppercase tracking-wider">Remaining Time</div>
            <div className={`text-2xl font-bold ${currentAvailable < 0 ? 'text-red-500' : 'text-primary'}`}>
              {Math.floor(currentAvailable / 60)}h {currentAvailable % 60}m
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPlanningMode(false)} className="border-border text-muted-foreground">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSavePlan} className="bg-primary text-white">
              Save Plan
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {mits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Important Tasks (MITs)</h3>
              {mits.map(task => (
                <div key={task.id} className="p-3 bg-card border border-border rounded-lg flex justify-between items-center group">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{task.title}</div>
                    {renderTaskDetails(task)}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePlannedTaskLocally(task.id)} className="h-6 px-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {regularTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Tasks</h3>
              {regularTasks.map(task => (
                <div key={task.id} className="p-3 bg-card border border-border rounded-lg flex justify-between items-center group">
                  <div className="flex-1">
                    <div className="text-sm text-foreground">{task.title}</div>
                    {renderTaskDetails(task)}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePlannedTaskLocally(task.id)} className="h-6 px-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {plannedTasks.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
              <span className="text-sm">Click tasks in the matrix to add them here</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExecutionMode = () => {
    if (!currentPlan || !currentPlan.tasks || currentPlan.tasks.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">📝</div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground">No Plan Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Create a plan for {activeTab === 'today' ? 'today' : 'tomorrow'} to stay focused and productive.</p>
          </div>
          <Button onClick={() => setPlanningMode(true, activeTab as 'today' | 'tomorrow')} className="bg-primary hover:bg-primary/90 text-white mt-4">
            Plan {activeTab === 'today' ? 'My Day' : 'Tomorrow'}
          </Button>
        </div>
      );
    }

    if (activeTab === 'today' && currentPlan.tasks.length > 0 && currentPlan.tasks.every(t => t.task.status === "Done")) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <span className="text-lg">🎉 Bạn đã hoàn thành tất cả công việc cho hôm nay. Tuyệt vời!</span>
        </div>
      );
    }

    const mits = currentPlan.tasks.filter(t => t.isMit);
    const regular = currentPlan.tasks.filter(t => !t.isMit);

    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Available Time</div>
            <div className="text-lg font-bold text-foreground">
              {Math.floor(currentPlan.availableMinutes / 60)}h {currentPlan.availableMinutes % 60}m
            </div>
          </div>
          {(!isStarted || activeTab === 'tomorrow') && (
            <Button variant="outline" size="sm" onClick={() => setPlanningMode(true, activeTab as 'today' | 'tomorrow')} className="border-border text-foreground">
              Edit {activeTab === 'today' ? 'My Day' : 'Tomorrow'}
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {mits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Important Tasks (MITs)</h3>
              {mits.map(pt => (
                <div key={pt.id} className="p-3 bg-card border border-primary/30 rounded-lg flex items-start space-x-3">
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${pt.task.status === "Done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {pt.task.title}
                    </div>
                    {renderTaskDetails(pt.task as any)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {regular.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Tasks</h3>
              {regular.map(pt => (
                <div key={pt.id} className="p-3 bg-card border border-border rounded-lg flex items-start space-x-3">
                  <div className="flex-1">
                    <div className={`text-sm ${pt.task.status === "Done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {pt.task.title}
                    </div>
                    {renderTaskDetails(pt.task as any)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex flex-col gap-2">
          {activeTab === 'today' ? (
            !isStarted ? (
              <>
                <Button
                  onClick={() => setIsStartMyDayOpen(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all"
                >
                  🚀 Start My Day
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsCancelModalOpen(true)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                  Cancel Plan
                </Button>
              </>
            ) : (
              <div className="text-center text-xs text-green-500/90 font-medium py-2 bg-green-500/5 rounded-xl border border-green-500/10">
                ✓ Kế hoạch hôm nay đang thực thi
              </div>
            )
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsCancelModalOpen(true)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              Cancel Plan
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border pl-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="today" className="data-[state=active]:bg-card data-[state=active]:text-foreground">Hôm nay</TabsTrigger>
            <TabsTrigger value="tomorrow" className="data-[state=active]:bg-card data-[state=active]:text-foreground">Ngày mai</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="today" className="flex-1 mt-0 outline-none flex flex-col h-full overflow-hidden">
          {isPlanningMode && planningTarget === 'today' ? renderPlanningMode() : (activeTab === 'today' && renderExecutionMode())}
        </TabsContent>
        
        <TabsContent value="tomorrow" className="flex-1 mt-0 outline-none flex flex-col h-full overflow-hidden">
          {isPlanningMode && planningTarget === 'tomorrow' ? renderPlanningMode() : (activeTab === 'tomorrow' && renderExecutionMode())}
        </TabsContent>
      </Tabs>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Cancel {activeTab === 'today' ? "Today's" : "Tomorrow's"} Plan?</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Bạn có chắc chắn muốn hủy kế hoạch {activeTab === 'today' ? 'hôm nay' : 'ngày mai'}? Các task chưa hoàn thành sẽ được trả về Backlog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="border-border text-foreground hover:bg-muted">
              No, Keep It
            </Button>
            <Button onClick={handleCancelPlan} className="bg-red-500 hover:bg-red-600 text-white">
              Yes, Cancel Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StartMyDayModal
        isOpen={isStartMyDayOpen}
        onClose={() => setIsStartMyDayOpen(false)}
        todayStr={currentDate}
      />
    </div>
  );
}

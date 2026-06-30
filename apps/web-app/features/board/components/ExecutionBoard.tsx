import { useState, useMemo } from "react";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { StartMyDayModal } from "./StartMyDayModal";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useRouter } from "next/navigation";

export function ExecutionBoard({ currentDate }: { currentDate: string }) {
  const router = useRouter();
  const { 
    tasks, 
    dailyPlanToday, 
    isPlanningMode, 
    setPlanningMode, 
    plannedTaskIds, 
    removePlannedTaskLocally,
    savePlan,
    cancelPlanToday,
    isStarted
  } = useBoardStore();
  
  const { openFocusMode } = useFocusStore();
  const availableTimeData = useAvailableTimeStore(s => s.data);
  const [activeTab, setActiveTab] = useState("today");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isStartMyDayOpen, setIsStartMyDayOpen] = useState(false);

  // Time calculations
  const baseAvailable = availableTimeData?.availableMinutes || 0;
  
  const currentAvailable = useMemo(() => {
    if (!isPlanningMode) {
      return dailyPlanToday ? dailyPlanToday.availableMinutes : baseAvailable;
    }
    
    // In planning mode, deduct the sum of planned tasks
    const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
    const usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    return Math.max(0, baseAvailable - usedTime);
  }, [isPlanningMode, baseAvailable, dailyPlanToday, plannedTaskIds, tasks]);

  const handleSavePlan = () => {
    savePlan(currentDate, currentAvailable);
  };

  const handleCancelPlan = () => {
    cancelPlanToday(currentDate);
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
        <span className="inline-flex items-center text-[10px] text-slate-400">
          <HugeiconsIcon icon={Calendar01Icon} size={10} className="mr-1" />
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
      
      {task.estimatedMinutes > 0 && (
        <div className="text-xs text-slate-500">{task.estimatedMinutes}m</div>
      )}
    </div>
  );

  const renderPlanningMode = () => {
    const plannedTasks = plannedTaskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as typeof tasks;
    const mits = plannedTasks.filter(t => t.isImportant);
    const regularTasks = plannedTasks.filter(t => !t.isImportant);

    return (
      <div className="flex-1 flex flex-col space-y-4">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="text-xs text-primary/80 font-semibold uppercase tracking-wider">Remaining Time</div>
            <div className={`text-2xl font-bold ${currentAvailable < 0 ? 'text-red-500' : 'text-primary'}`}>
              {Math.floor(currentAvailable / 60)}h {currentAvailable % 60}m
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPlanningMode(false)} className="border-slate-800 text-slate-300">
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
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Most Important Tasks (MITs)</h3>
              {mits.map(task => (
                <div key={task.id} className="p-3 bg-slate-900 border border-slate-700 rounded-lg flex justify-between items-center group">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-100">{task.title}</div>
                    {renderTaskDetails(task)}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePlannedTaskLocally(task.id)} className="h-6 px-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {regularTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Other Tasks</h3>
              {regularTasks.map(task => (
                <div key={task.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center group">
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">{task.title}</div>
                    {renderTaskDetails(task)}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePlannedTaskLocally(task.id)} className="h-6 px-2 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {plannedTasks.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <span className="text-sm">Click tasks in the matrix to add them here</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExecutionMode = () => {
    if (!dailyPlanToday || !dailyPlanToday.tasks || dailyPlanToday.tasks.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-3xl">📝</div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-200">No Plan Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-[200px]">Create a plan for today to stay focused and productive.</p>
          </div>
          <Button onClick={() => setPlanningMode(true)} className="bg-primary hover:bg-primary/90 text-white mt-4">
            Plan My Day
          </Button>
        </div>
      );
    }

    const mits = dailyPlanToday.tasks.filter(t => t.isMit);
    const regular = dailyPlanToday.tasks.filter(t => !t.isMit);

    return (
      <div className="flex-1 flex flex-col space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Available Time</div>
            <div className="text-lg font-bold text-slate-300">
              {Math.floor(dailyPlanToday.availableMinutes / 60)}h {dailyPlanToday.availableMinutes % 60}m
            </div>
          </div>
          {!isStarted && (
            <Button variant="outline" size="sm" onClick={() => setPlanningMode(true)} className="border-slate-800 text-slate-300">
              Edit My Day
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {mits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Most Important Tasks (MITs)</h3>
              {mits.map(pt => (
                <div key={pt.id} className="p-3 bg-slate-900 border border-primary/30 rounded-lg flex items-start space-x-3">
                  <Checkbox 
                    checked={pt.task.status === "Done"} 
                    onCheckedChange={() => useBoardStore.getState().toggleTaskDone(currentDate, pt.id)}
                    className="mt-1 border-primary/50 data-[state=checked]:bg-primary"
                  />
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${pt.task.status === "Done" ? "text-slate-500 line-through" : "text-slate-100"}`}>
                      {pt.task.title}
                    </div>
                    {renderTaskDetails(pt.task as any)}
                  </div>
                  {isStarted && pt.task.status !== "Done" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full"
                      onClick={() => {
                        openFocusMode(pt.task.id, pt.id, pt.task.estimatedMinutes || 25);
                        router.push('/flow');
                      }}
                    >
                      <HugeiconsIcon icon={PlayIcon} size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {regular.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Other Tasks</h3>
              {regular.map(pt => (
                <div key={pt.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start space-x-3">
                  <Checkbox 
                    checked={pt.task.status === "Done"} 
                    onCheckedChange={() => useBoardStore.getState().toggleTaskDone(currentDate, pt.id)}
                    className="mt-1 border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <div className={`text-sm ${pt.task.status === "Done" ? "text-slate-600 line-through" : "text-slate-300"}`}>
                      {pt.task.title}
                    </div>
                    {renderTaskDetails(pt.task as any)}
                  </div>
                  {isStarted && pt.task.status !== "Done" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full"
                      onClick={() => {
                        openFocusMode(pt.task.id, pt.id, pt.task.estimatedMinutes || 25);
                        router.push('/flow');
                      }}
                    >
                      <HugeiconsIcon icon={PlayIcon} size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
          {!isStarted ? (
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
            <div className="text-center text-xs text-green-400/90 font-medium py-2 bg-green-500/5 rounded-xl border border-green-500/10">
              ✓ Kế hoạch hôm nay đang thực thi
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800 pl-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="today" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">Hôm nay</TabsTrigger>
            <TabsTrigger value="tomorrow" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">Ngày mai</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="today" className="flex-1 mt-0 outline-none flex flex-col h-full overflow-hidden">
          {isPlanningMode ? renderPlanningMode() : renderExecutionMode()}
        </TabsContent>
        
        <TabsContent value="tomorrow" className="flex-1 mt-0 outline-none flex flex-col h-full">
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-3xl">🌅</div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-slate-200">Tomorrow</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-[200px]">
                {(!dailyPlanToday || !dailyPlanToday.isConfirmed) 
                  ? "Finish today's plan before preparing for tomorrow."
                  : "Plan for tomorrow is locked."}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-50 border-slate-800">
          <DialogHeader>
            <DialogTitle>Cancel Today's Plan?</DialogTitle>
            <DialogDescription className="text-slate-400 pt-2">
              Bạn có chắc chắn muốn hủy kế hoạch hôm nay? Các task chưa hoàn thành sẽ được trả về Backlog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
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

import { Button } from "@/components/ui/button";

interface NoPlanStateProps {
  activeTab: string;
  onStartPlanning: () => void;
}

export function NoPlanState({ activeTab, onStartPlanning }: NoPlanStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">📝</div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground">No Plan Yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
          Create a plan for {activeTab === 'today' ? 'today' : 'tomorrow'} to stay focused and productive.
        </p>
      </div>
      <Button onClick={onStartPlanning} className="bg-primary hover:bg-primary/90 text-white mt-4 cursor-pointer">
        Plan {activeTab === 'today' ? 'My Day' : 'Tomorrow'}
      </Button>
    </div>
  );
}

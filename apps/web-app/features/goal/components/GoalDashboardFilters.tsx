import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GoalDashboardFiltersProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
}

export function GoalDashboardFilters({
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
}: GoalDashboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-fit">
        <TabsList className="bg-muted border border-border text-muted-foreground h-9 p-1">
          <TabsTrigger value="ALL" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
          <TabsTrigger value="In Progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">In Progress</TabsTrigger>
          <TabsTrigger value="Freeze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Freeze</TabsTrigger>
          <TabsTrigger value="Done" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Done</TabsTrigger>
          <TabsTrigger value="Archived" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
          <SelectValue placeholder="Loại Goal" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          <SelectItem value="ALL">All types</SelectItem>
          <SelectItem value="Binary">Project</SelectItem>
          <SelectItem value="Time-boxed">Habit</SelectItem>
          <SelectItem value="Milestone">Target</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

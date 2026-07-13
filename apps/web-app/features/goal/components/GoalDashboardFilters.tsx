import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-fit">
        <TabsList className="bg-muted border border-border text-muted-foreground h-9 p-1">
          <TabsTrigger value="ALL" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t.goals.all}</TabsTrigger>
          <TabsTrigger value="In Progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t.goals.inProgress}</TabsTrigger>
          <TabsTrigger value="Freeze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t.goals.freeze}</TabsTrigger>
          <TabsTrigger value="Done" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t.goals.done}</TabsTrigger>
          <TabsTrigger value="Archived" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t.goals.archived}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
          <SelectValue placeholder={t.goals.typePlaceholder} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground">
          <SelectItem value="ALL">{t.goals.allTypes}</SelectItem>
          <SelectItem value="Binary">{t.goals.project}</SelectItem>
          <SelectItem value="Time-boxed">{t.goals.habit}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

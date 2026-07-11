import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RangeTabsProps {
  range: "week" | "month" | "year";
  setRange: (val: "week" | "month" | "year") => void;
}

export function RangeTabs({ range, setRange }: RangeTabsProps) {
  return (
    <Tabs
      value={range}
      onValueChange={(val) => setRange(val as "week" | "month" | "year")}
      className="w-fit"
    >
      <TabsList className="bg-transparent border-0 text-muted-foreground h-8 p-0 flex gap-1">
        <TabsTrigger
          value="week"
          className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg cursor-pointer"
        >
          Tuần
        </TabsTrigger>
        <TabsTrigger
          value="month"
          className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg cursor-pointer"
        >
          Tháng
        </TabsTrigger>
        <TabsTrigger
          value="year"
          className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg cursor-pointer"
        >
          Năm
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

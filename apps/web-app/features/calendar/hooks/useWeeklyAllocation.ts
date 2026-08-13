import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";

export interface CategoryAllocation {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  scheduledMinutes: number;
}

export interface WeeklyAllocationSummary {
  totalAvailableMinutes: number;
  totalScheduledMinutes: number;
  bufferMinutes: number;
  freeMinutes: number;
  byCategory: CategoryAllocation[];
}

export function useWeeklyAllocation() {
  return useQuery<WeeklyAllocationSummary>({
    queryKey: ["weeklyAllocation"],
    queryFn: async () => {
      const res = await fetchClient.get<WeeklyAllocationSummary>("calendar/weekly-allocation");
      return res.data;
    },
  });
}

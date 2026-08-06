import { useQuery } from '@tanstack/react-query';
import { fetchClient } from '@/lib/fetchClient';
import type { TaskTimeBlock } from '../types';

export function useTaskTimeBlocks(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['timeBlocks', startDate, endDate],
    queryFn: async () => {
      const response = await fetchClient.get<TaskTimeBlock[]>(`time-blocks/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

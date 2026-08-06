import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useGamificationStore} from "@/features/gamification";
import {fetchClient} from "@/lib/fetchClient";
import type {AvailableTimeData} from "@/features/available-time";

export function useCheckinMutation() {
    const queryClient = useQueryClient();
    const setStreakToCelebrate = useGamificationStore((s) => s.setStreakToCelebrate);

    return useMutation({
        mutationFn: async ({date, checkinTime}: { date: string; checkinTime?: string }) => {
            let url = `calendar/checkin?date=${date}`;
            if (checkinTime) url += `&checkinTime=${checkinTime}`;
            const r = await fetchClient.post<AvailableTimeData>(url, {});
            return r.data;
        },
        onSuccess: (data, {date}) => {
            // Update cache
            queryClient.setQueryData(["availableTime", date], data);

            // Invalidate queries to trigger immediate UI update for auto-created tasks/plans
            queryClient.invalidateQueries({queryKey: ["tasks"]});
            queryClient.invalidateQueries({queryKey: ["dailyPlan", date]});

            // Trigger celebration if streak > 0
            if (data && data.streak > 0) {
                setStreakToCelebrate(data.streak);
            }
        },
    });
}
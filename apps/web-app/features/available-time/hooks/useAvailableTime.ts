import { useCallback } from "react";
import { useAvailableTimeStore } from "../store/available-time.store";

export function useAvailableTime() {
  const data = useAvailableTimeStore((s) => s.data);
  const isLoading = useAvailableTimeStore((s) => s.isLoading);
  const fetchAvailableTime = useAvailableTimeStore((s) => s.fetchAvailableTime);
  const checkinAction = useAvailableTimeStore((s) => s.checkin);

  const checkin = useCallback(async (date: string, checkinTime?: string) => {
    await checkinAction(date, checkinTime);
  }, [checkinAction]);

  return {
    data,
    isLoading,
    fetchAvailableTime,
    checkin,
  };
}

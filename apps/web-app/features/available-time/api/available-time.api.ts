import { get, post } from "@/lib/fetchClient";
import type { AvailableTimeData } from "../types";

export const availableTimeApi = {
  getAvailableTime: (date: string) =>
    get<AvailableTimeData>(`calendar/available-time?date=${date}`),

  checkin: (date: string, checkinTime?: string) => {
    let url = `calendar/checkin?date=${date}`;
    if (checkinTime) {
      url += `&checkinTime=${checkinTime}`;
    }
    return post<AvailableTimeData, Record<string, never>>(url, {});
  },
};

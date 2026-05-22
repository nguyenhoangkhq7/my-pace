import { fetchClient } from "@/lib/fetchClient";
import {CalendarEvent, ScheduledTask, CalendarEventInput} from "../types/calendar.type";

export const calendarService = {
    async getEvents(): Promise<CalendarEvent[]> {
        try {
            const res = await fetchClient.get<CalendarEvent[]>("events/upcoming");
            return res.data || [];
        } catch {
            const res = await fetchClient.get<CalendarEvent[]>("events");
            return res.data || [];
        }
    },

    async createEvent(eventData: CalendarEventInput): Promise<CalendarEvent> {
        const res = await fetchClient.post<CalendarEvent, CalendarEventInput>("events", eventData);
        if (!res.data) throw new Error("Failed to create event");
        return res.data;
    },

    async updateEvent(id: number, eventData: CalendarEventInput): Promise<CalendarEvent> {
        const res = await fetchClient.put<CalendarEvent, CalendarEventInput>(`events/${id}`, eventData);
        if (!res.data) throw new Error("Failed to update event");
        return res.data;
    },

    async deleteEvent(id: number): Promise<void> {
        await fetchClient.del<void>(`events/${id}`);
    },

    // ── 5 Hàm bạn muốn tách liên quan đến Scheduled Tasks ───────────────────────────
    async getScheduledTasks(): Promise<ScheduledTask[]> {
        const res = await fetchClient.get<ScheduledTask[]>("scheduled-tasks");
        return res.data || [];
    },

    async scheduleTask(taskId: number, startTime: string, endTime: string): Promise<ScheduledTask> {
        const res = await fetchClient.post<ScheduledTask, { taskId: number; startTime: string; endTime: string }>(
            "scheduled-tasks",
            { taskId, startTime, endTime },
        );
        if (!res.data) throw new Error("Failed to schedule task");
        return res.data;
    },

    async updateScheduledTask(id: number, startTime: string, endTime: string): Promise<ScheduledTask> {
        const res = await fetchClient.put<ScheduledTask, { startTime: string; endTime: string }>(
            `scheduled-tasks/${id}`,
            { startTime, endTime },
        );
        if (!res.data) throw new Error("Failed to update scheduled task");
        return res.data;
    },

    async unscheduleTask(id: number): Promise<void> {
        await fetchClient.del<void>(`scheduled-tasks/${id}`);
    },

    async autoScheduleTask(taskId: number): Promise<ScheduledTask> {
        const res = await fetchClient.post<ScheduledTask, { taskId: number }>(
            "scheduled-tasks/auto-schedule",
            { taskId },
        );
        if (!res.data) throw new Error("Failed to auto-schedule task");
        return res.data;
    },
};
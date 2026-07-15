import { z } from "zod";

export const goalFormSchema = z.object({
  title: z.string().min(1, "Tên mục tiêu không được để trống"),
  goalType: z.enum(["Time-boxed", "Binary"]),
  status: z.string(),
  categoryId: z.string().refine((val) => val !== "none" && val !== "", {
    message: "Danh mục là bắt buộc",
  }),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  autoCreateTask: z.boolean(),
  durationMinutes: z.union([
    z.number().min(1, "Thời gian phải lớn hơn 0"),
    z.nan()
  ]).optional().nullable(),
  daysOfWeek: z.string().optional().nullable(),
  preferTime: z.string().optional().nullable(),
});

export interface GoalFormValues {
  title: string;
  goalType: "Time-boxed" | "Binary";
  status: string;
  categoryId: string;
  startDate?: string | null;
  endDate?: string | null;
  autoCreateTask: boolean;
  durationMinutes?: number | null;
  daysOfWeek?: string | null;
  preferTime?: string | null;
}

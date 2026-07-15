import { z } from "zod";

export const taskFormSchema = (requireDuration: boolean) => z.object({
  title: z.string().min(1, "Tên công việc không được để trống"),
  estimatedMinutes: requireDuration
    ? z.number({ message: "Thời gian ước tính không được để trống" })
        .min(1, "Thời gian ước tính phải lớn hơn 0")
    : z.number().min(1, "Thời gian ước tính phải lớn hơn 0").optional().nullable(),
  notes: z.string().optional().nullable(),
  isUrgent: z.boolean(),
  isImportant: z.boolean(),
  categoryId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
});

export type TaskFormValues = z.infer<ReturnType<typeof taskFormSchema>>;

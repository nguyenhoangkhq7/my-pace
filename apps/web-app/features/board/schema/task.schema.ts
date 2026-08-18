import { z } from "zod";

export const taskFormSchema = (requireDuration: boolean) => z.object({
  title: z.string()
    .trim()
    .min(1, "Tên công việc không được để trống")
    .max(255, "Tên công việc không được vượt quá 255 ký tự"),
  estimatedMinutes: requireDuration
    ? z.number({ message: "Thời gian ước tính không được để trống" })
        .min(1, "Thời gian ước tính phải lớn hơn 0")
        .max(1440, "Thời gian ước tính không được vượt quá 24 tiếng (1440 phút)")
    : z.number()
        .min(1, "Thời gian ước tính phải lớn hơn 0")
        .max(1440, "Thời gian ước tính không được vượt quá 24 tiếng (1440 phút)")
        .optional()
        .nullable(),
  notes: z.string().max(5000, "Ghi chú không được vượt quá 5000 ký tự").optional().nullable(),
  isUrgent: z.boolean(),
  isImportant: z.boolean(),
  categoryId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  isSplittable: z.boolean(),
  minChunkMinutes: z.number().min(15, "Thời lượng 1 block tối thiểu từ 15 phút").max(1440).optional().nullable(),
  maxDailyDuration: z.number().min(15, "Thời lượng tối đa 1 ngày tối thiểu từ 15 phút").max(720, "Thời lượng tối đa 1 ngày không được vượt quá 12 tiếng (720 phút)").optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.isSplittable) {
    const est = data.estimatedMinutes ? Number(data.estimatedMinutes) : 0;
    
    if (!est || est < 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Thời gian ước tính phải từ 15 phút trở lên mới có thể chia nhỏ",
        path: ["estimatedMinutes"],
      });
    }

    if (data.minChunkMinutes !== undefined && data.minChunkMinutes !== null) {
      const minChunk = Number(data.minChunkMinutes);
      if (minChunk < 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thời lượng 1 block tối thiểu phải từ 15 phút",
          path: ["minChunkMinutes"],
        });
      } else if (est > 0 && minChunk > est) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Thời lượng 1 block (${minChunk}m) không được lớn hơn tổng thời gian công việc (${est}m)`,
          path: ["minChunkMinutes"],
        });
      }
      
      if (data.maxDailyDuration !== undefined && data.maxDailyDuration !== null) {
        const maxDaily = Number(data.maxDailyDuration);
        if (maxDaily > 720) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Thời lượng tối đa 1 ngày không được vượt quá 12 tiếng (720 phút)",
            path: ["maxDailyDuration"],
          });
        } else if (maxDaily < minChunk) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Thời lượng tối đa 1 ngày (${maxDaily}m) không được nhỏ hơn thời lượng 1 block (${minChunk}m)`,
            path: ["maxDailyDuration"],
          });
        }
      }
    }
  }
});

export type TaskFormValues = z.infer<ReturnType<typeof taskFormSchema>>;


import * as z from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  wakeTime: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/, "Invalid wake time format"),
  sleepTime: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/, "Invalid sleep time format"),
  timezone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

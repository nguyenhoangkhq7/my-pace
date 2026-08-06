import * as z from 'zod';

export const loginSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(8),
})

export type LoginValues = z.infer<typeof loginSchema>;

const emailFieldSchema = z.email("Invalid email");
const otpFieldSchema = z.string().min(6, "OTP must be 6 characters").max(6, "OTP must be 6 characters");
const fullNameFieldSchema = z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters");
const passwordFieldSchema = z.string().min(8, "Password must be at least 8 characters");

export const registerBaseSchema = z.object({
    email: emailFieldSchema,
    otp: otpFieldSchema,
    fullName: fullNameFieldSchema,
    password: passwordFieldSchema,
    confirmPassword: passwordFieldSchema,
});

export const registerSchema = registerBaseSchema;

export const emailStepSchema = registerBaseSchema.pick({
    email: true,
});

export const otpStepSchema = registerBaseSchema.pick({
    otp: true,
});

export const userDataStepSchema = registerBaseSchema
    .pick({
        fullName: true,
        password: true,
        confirmPassword: true,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export type RegisterValues = z.infer<typeof registerSchema>;
export type EmailStepValues = z.infer<typeof emailStepSchema>;
export type OtpStepValues = z.infer<typeof otpStepSchema>;
export type UserDataStepValues = z.infer<typeof userDataStepSchema>;



export const initialSetupSchema = z.object({
  wakeTime: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/, "Invalid wake time format"),
  sleepTime: z.string().regex(/^[0-2][0-9]:[0-5][0-9]$/, "Invalid sleep time format"),
});

export type InitialSetupFormValues = z.infer<typeof initialSetupSchema>;

export const resetPasswordSchema = z
  .object({
    email: emailFieldSchema,
    otp: otpFieldSchema,
    password: passwordFieldSchema,
    confirmPassword: passwordFieldSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;




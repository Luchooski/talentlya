import { z } from 'zod';

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  orgName: z.string().min(3, 'Nombre de organización muy corto'),
});

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const AuthUserSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  orgId: z.string(),
});

export const MeOutputSchema = z.object({
  user: AuthUserSchema,
});

// --- Password reset / verify ---
export const ForgotPasswordInputSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

export const VerifyEmailInputSchema = z.object({
  token: z.string().min(10),
});

export const ChangePasswordInputSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});


export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;
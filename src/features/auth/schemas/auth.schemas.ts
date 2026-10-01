import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(128);

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name.").max(50),
  lastName: z.string().trim().min(1, "Please enter your last name.").max(50),
  email: z.email("Enter a valid email address.").trim(),
  password: passwordSchema,
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Passwords don't match.",
  });
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;

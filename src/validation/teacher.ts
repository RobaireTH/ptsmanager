import { z } from 'zod';

export const createTeacherSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subjects: z.string().optional(), // comma-separated input
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
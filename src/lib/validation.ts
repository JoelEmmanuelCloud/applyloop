import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(1).max(30),
  resumeSummary: z.string().trim().min(1).max(2000),
  essayAnswer1: z.string().trim().min(1).max(2000),
  essayAnswer2: z.string().trim().min(1).max(2000),
});

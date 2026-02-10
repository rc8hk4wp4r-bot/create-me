import { z } from "zod";

export const energySchema = z.number().int().min(0).max(100);

export const toggleHabitSchema = z.object({
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  done: z.boolean(),
});

export const setIntensitySchema = z.object({
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  intensity: z.enum(["S", "M", "L"]),
});

export const proposalDecisionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  action: z.enum(["accept", "downgrade"]),
});

import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  mode: z.enum(['checkbox', 'numerical']).optional().default('checkbox'),
  target: z.number().optional().nullable(),
  unit: z.string().optional().default(''),
  dueDate: z.string().optional().nullable(),
  // Period fields intentionally unused as of Phase 10
  periodType: z.enum(['weekly', 'monthly', 'custom']).optional(),
  periodEnd: z.string().optional().nullable(),
  currentPeriodStart: z.string().optional().nullable(),
  recurrenceMode: z.enum(['none', 'manual', 'auto']).optional().default('none'),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'complete', 'abandoned']).optional(),
  mode: z.enum(['checkbox', 'numerical']).optional(),
  target: z.number().optional().nullable(),
  unit: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  // Period fields intentionally unused as of Phase 10
  periodType: z.enum(['weekly', 'monthly', 'custom']).optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  currentPeriodStart: z.string().optional().nullable(),
  recurrenceMode: z.enum(['none', 'manual', 'auto']).optional(),
});

export const createActionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentGoalId: z.string().min(1, 'Parent Goal ID is required'),
  target: z.number().optional(),
  unit: z.string().optional().default(''),
  periodType: z.enum(['weekly', 'monthly', 'custom']).optional(),
  periodEnd: z.string().optional().nullable(),
  currentPeriodStart: z.string().optional().nullable(),
  recurrenceMode: z.enum(['none', 'manual', 'auto']).optional().default('none'),
  dueDate: z.string().optional().nullable(),
  lateralLinkTargetId: z.string().optional().nullable(),
  lateralLinkType: z.enum(['count', 'value']).optional().nullable(),
});

export const updateActionSchema = z.object({
  name: z.string().min(1).optional(),
  parentGoalId: z.string().min(1).optional(),
  status: z.enum(['active', 'complete', 'abandoned']).optional(),
  target: z.number().optional().nullable(),
  unit: z.string().optional(),
  periodType: z.enum(['weekly', 'monthly', 'custom']).optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  currentPeriodStart: z.string().optional().nullable(),
  recurrenceMode: z.enum(['none', 'manual', 'auto']).optional(),
  dueDate: z.string().optional().nullable(),
  lateralLinkTargetId: z.string().optional().nullable(),
  lateralLinkType: z.enum(['count', 'value']).optional().nullable(),
});

export const createLogSchema = z.object({
  sourceId: z.string().min(1, 'Source ID is required'),
  sourceType: z.enum(['goal', 'action'], { message: 'sourceType must be goal or action' }),
  value: z.number(),
  logDate: z.string().min(1, 'Log date is required'),
  entryType: z.enum(['numeric', 'boolean']).default('numeric'),
});

export const updateLogSchema = z.object({
  value: z.number(),
});

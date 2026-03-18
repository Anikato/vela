'use server';

import { z } from 'zod';
import type { ActionResult } from '@/types';
import { requireAuth } from '@/server/actions/lib/auth';
import {
  getRedirectList,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  type Redirect,
} from '@/server/services/redirect.service';

export async function getRedirectListAction(): Promise<ActionResult<Redirect[]>> {
  try {
    await requireAuth();
    const list = await getRedirectList();
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

const createSchema = z.object({
  fromPath: z.string().min(1, '源路径不能为空'),
  toPath: z.string().min(1, '目标路径不能为空'),
  statusCode: z.number().int().min(300).max(399).optional(),
  isActive: z.boolean().optional(),
});

export async function createRedirectAction(
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<Redirect>> {
  try {
    await requireAuth();
    const parsed = createSchema.parse(input);
    const row = await createRedirect(parsed);
    return { success: true, data: row };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

const updateSchema = z.object({
  id: z.number().int(),
  fromPath: z.string().min(1).optional(),
  toPath: z.string().min(1).optional(),
  statusCode: z.number().int().min(300).max(399).optional(),
  isActive: z.boolean().optional(),
});

export async function updateRedirectAction(
  input: z.infer<typeof updateSchema>,
): Promise<ActionResult<Redirect>> {
  try {
    await requireAuth();
    const { id, ...rest } = updateSchema.parse(input);
    const row = await updateRedirect(id, rest);
    return { success: true, data: row };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteRedirectAction(id: number): Promise<ActionResult<null>> {
  try {
    await requireAuth();
    await deleteRedirect(id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

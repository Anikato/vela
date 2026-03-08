'use server';

import { z } from 'zod';

import type { ActionResult } from '@/types';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { auth } from '@/server/auth';
import { deleteMediaById } from '@/server/services/media.service';

const mediaIdSchema = z.string().uuid();

function handleError(error: unknown): ActionResult<never> {
  if (error instanceof NotFoundError) {
    return { success: false, error: error.message };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }

  console.error('Unexpected media action error:', error);
  return { success: false, error: 'An unexpected error occurred' };
}

/**
 * 删除媒体文件
 */
export async function deleteMediaAction(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsedId = mediaIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid media id' };
  }

  try {
    await deleteMediaById(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

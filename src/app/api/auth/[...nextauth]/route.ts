/**
 * Auth.js API Route
 * 处理 /api/auth/* 的所有认证请求
 */

import { handlers } from '@/server/auth';

export const { GET, POST } = handlers;

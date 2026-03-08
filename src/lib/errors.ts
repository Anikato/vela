/** 实体未找到错误 */
export class NotFoundError extends Error {
  constructor(entity: string, identifier: string) {
    super(`${entity} not found: ${identifier}`);
    this.name = 'NotFoundError';
  }
}

/** 重复记录错误 */
export class DuplicateError extends Error {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} "${value}" already exists`);
    this.name = 'DuplicateError';
  }
}

/** 权限不足错误 */
export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** 业务逻辑验证错误 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

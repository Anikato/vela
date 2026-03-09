/** 用户角色（当前仅支持管理员） */
export const ROLES = {
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** 产品状态 */
export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

/** 页面状态 */
export const PAGE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

/** 询盘状态 */
export const INQUIRY_STATUS = {
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied',
  CLOSED: 'closed',
  SPAM: 'spam',
} as const;

/** 导航菜单类型 */
export const NAV_TYPES = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
  CATEGORY: 'category',
  PAGE: 'page',
} as const;

/** 区块放置位置 */
export const SECTION_PLACEMENT = {
  MAIN: 'main',
  TOP: 'top',
  BOTTOM: 'bottom',
} as const;

/** 文件上传限制 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_UPLOAD_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  IMAGE_SIZES: {
    thumbnail: 200,
    small: 400,
    medium: 800,
    large: 1200,
  },
} as const;

/** 分页默认值 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
} as const;

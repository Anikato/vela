# Vela — Action 契约文档

> 文档目的：记录 Server Action 的输入/输出契约，便于前端联调与回归。  
> 更新原则：任何 Server Action 的新增/修改/删除，必须同步更新本文档。  
> 适用范围：`src/server/actions/**/*.actions.ts`

---

## 统一约定

### 返回结构（`ActionResult<T>`）

```typescript
{ success: true, data: T }
```

```typescript
{ success: false, error: string }
```

```typescript
{ success: false, error: Record<string, string[]> }
```

### 错误类型

- `string`：业务错误、权限错误、未知错误
- `Record<string, string[]>`：字段校验错误（Zod）

---

## 语言管理模块

文件：`src/server/actions/language.actions.ts`

### 类型定义（关键字段）

```typescript
type Language = {
  code: string;
  englishName: string;
  nativeName: string;
  chineseName: string;
  azureCode: string | null;
  googleCode: string | null;
  isRtl: boolean;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
```

### Action 列表

#### 1) `getAllLanguagesAction()`

- **入参**：无
- **返回**：`ActionResult<Language[]>`

#### 2) `getActiveLanguagesAction()`

- **入参**：无
- **返回**：`ActionResult<Language[]>`

#### 3) `createLanguageAction(input)`

- **入参**：

```typescript
{
  code: string;               // 兼容 BCP 47 风格，如 en-US / zh-Hans
  englishName: string;
  nativeName: string;
  chineseName: string;
  azureCode?: string;
  googleCode?: string;
  isRtl?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}
```

- **返回**：`ActionResult<Language>`

#### 4) `updateLanguageAction(code, input)`

- **入参**：

```typescript
code: string
input: {
  englishName?: string;
  nativeName?: string;
  chineseName?: string;
  azureCode?: string;
  googleCode?: string;
  isRtl?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}
```

- **返回**：`ActionResult<Language>`

#### 5) `deleteLanguageAction(code)`

- **入参**：`code: string`
- **返回**：`ActionResult<void>`

#### 6) `setDefaultLanguageAction(code)`

- **入参**：`code: string`
- **返回**：`ActionResult<Language>`

#### 7) `reorderLanguagesAction(orderedCodes)`

- **入参**：

```typescript
orderedCodes: string[]
```

- **返回**：`ActionResult<void>`

#### 8) `toggleLanguageActiveAction(code)`

- **入参**：`code: string`
- **返回**：`ActionResult<Language>`

---

## 媒体管理模块

文件：`src/server/actions/media.actions.ts`

### Action 列表

#### 1) `deleteMediaAction(id)`

- **入参**：`id: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`
- **失败错误**：
  - `Unauthorized`
  - `Invalid media id`
  - `Media not found: {id}`

---

## 前端调用建议

- Client 组件调用 Action 后，统一判断 `result.success`
- `result.error` 为对象时，按字段映射到表单错误；为字符串时走 toast 提示
- 列表页更新后建议 `router.refresh()` 保证服务端数据一致

---

## 变更记录

| 日期 | 变更 | 说明 |
|---|---|---|
| 2026-03 | 初始化 Action 契约文档 | 收录语言管理模块全部 Action |
| 2026-03 | 新增媒体管理 Action 契约 | 收录 `deleteMediaAction` 的鉴权与参数约束 |

---

## 用户管理模块

文件：`src/server/actions/user.actions.ts`

### Action 列表

#### 1) `getAllUsersAction()`

- **入参**：无
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<SafeUser[]>`

#### 2) `createUserAction(input)`

- **入参**：

```typescript
{
  email: string;   // email
  username: string; // 1-100，用于登录
  password: string; // 8-100
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<SafeUser>`

#### 3) `setUserActiveAction(input)`

- **入参**：

```typescript
{
  id: string;       // uuid
  isActive: boolean;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<SafeUser>`
- **业务约束**：不能停用当前登录账号

#### 4) `resetUserPasswordAction(input)`

- **入参**：

```typescript
{
  id: string;        // uuid
  password: string;  // 8-100
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 5) `updateUserProfileAction(input)`

- **入参**：

```typescript
{
  id: string;        // uuid
  email: string;     // email
  username: string;  // 1-100
  password?: string; // 8-100，可选
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<SafeUser>`
- **说明**：支持一次性更新邮箱、用户名、密码（密码可不传）

---

## 分类管理模块

文件：`src/server/actions/category.actions.ts`

### Action 列表

#### 1) `getCategoryListAction(locale, defaultLocale)`

- **入参**：

```typescript
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<CategoryListItem[]>`

#### 2) `createCategoryAction(input)`

- **入参**：

```typescript
{
  slug: string; // kebab-case
  parentId?: string | null; // uuid
  isActive?: boolean;
  sortOrder?: number;
  translations: Array<{
    locale: string;
    name?: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<CategoryWithTranslations>`

#### 3) `updateCategoryAction(id, input)`

- **入参**：

```typescript
id: string; // uuid
input: {
  slug?: string; // kebab-case
  parentId?: string | null; // uuid
  isActive?: boolean;
  sortOrder?: number;
  translations?: Array<{
    locale: string;
    name?: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<CategoryWithTranslations>`

#### 4) `deleteCategoryAction(id)`

- **入参**：`id: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`
- **业务约束**：有子分类时不可删除

#### 5) `reorderCategoryTreeAction(input)`

- **入参**：

```typescript
{
  items: Array<{
    id: string; // uuid
    parentId: string | null; // uuid | null
    sortOrder: number; // >= 0
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`
- **业务约束**：不允许形成循环父子关系

---

## 标签管理模块

文件：`src/server/actions/tag.actions.ts`

### Action 列表

#### 1) `getTagListAction(locale, defaultLocale)`

- **入参**：

```typescript
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<TagListItem[]>`

#### 2) `createTagAction(input)`

- **入参**：

```typescript
{
  slug: string; // kebab-case
  translations: Array<{
    locale: string;
    name?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<TagWithTranslations>`

#### 3) `updateTagAction(id, input)`

- **入参**：

```typescript
id: string; // uuid
input: {
  slug?: string; // kebab-case
  translations?: Array<{
    locale: string;
    name?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<TagWithTranslations>`

#### 4) `deleteTagAction(id)`

- **入参**：`id: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

---

## 产品管理模块

文件：`src/server/actions/product.actions.ts`

### Action 列表

#### 1) `getProductListAction(locale, defaultLocale)`

- **入参**：

```typescript
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<ProductListItem[]>`

#### 2) `createProductAction(input)`

- **入参**：

```typescript
{
  sku: string;
  slug: string; // kebab-case
  primaryCategoryId: string; // uuid
  status?: 'draft' | 'published' | 'archived';
  sortOrder?: number;
  featuredImageId?: string | null; // uuid
  videoLinks?: string[]; // url[]
  moq?: number | null;
  leadTimeDays?: number | null;
  tradeTerms?: string | null;
  paymentTerms?: string | null;
  packagingDetails?: string | null;
  customizationSupport?: boolean;
  additionalCategoryIds?: string[]; // uuid[]
  tagIds?: string[]; // uuid[]
  galleryImageIds?: string[]; // uuid[]
  attachmentIds?: string[]; // uuid[]
  translations: Array<{
    locale: string;
    name?: string;
    shortDescription?: string;
    description?: string; // HTML
    seoTitle?: string;
    seoDescription?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<ProductWithRelations>`

#### 3) `updateProductAction(id, input)`

- **入参**：

```typescript
id: string; // uuid
input: {
  sku?: string;
  slug?: string; // kebab-case
  primaryCategoryId?: string; // uuid
  status?: 'draft' | 'published' | 'archived';
  sortOrder?: number;
  featuredImageId?: string | null; // uuid
  videoLinks?: string[]; // url[]
  moq?: number | null;
  leadTimeDays?: number | null;
  tradeTerms?: string | null;
  paymentTerms?: string | null;
  packagingDetails?: string | null;
  customizationSupport?: boolean;
  additionalCategoryIds?: string[]; // uuid[]
  tagIds?: string[]; // uuid[]
  galleryImageIds?: string[]; // uuid[]
  attachmentIds?: string[]; // uuid[]
  translations?: Array<{
    locale: string;
    name?: string;
    shortDescription?: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<ProductWithRelations>`

#### 4) `deleteProductAction(id)`

- **入参**：`id: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

---

## 页面管理模块

文件：`src/server/actions/page.actions.ts`

### Action 列表

#### 1) `getPageListAction(locale, defaultLocale)`

- **入参**：

```typescript
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<PageListItem[]>`

#### 2) `createPageAction(input)`

- **入参**：

```typescript
{
  slug: string; // kebab-case
  status?: 'draft' | 'published';
  isHomepage?: boolean;
  template?: string | null; // <= 50
  translations: Array<{
    locale: string;
    title?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<PageWithTranslations>`
- **业务约束**：`translations` 中至少一个 `title` 非空；设置 `isHomepage=true` 时会自动取消其他页面的首页标记

#### 3) `updatePageAction(id, input)`

- **入参**：

```typescript
id: string; // uuid
input: {
  slug?: string; // kebab-case
  status?: 'draft' | 'published';
  isHomepage?: boolean;
  template?: string | null; // <= 50
  translations?: Array<{
    locale: string;
    title?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<PageWithTranslations>`

#### 4) `deletePageAction(id)`

- **入参**：`id: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`
- **业务约束**：首页页面不可删除，需先将其他页面设为首页

---

## 区块管理模块

文件：`src/server/actions/section.actions.ts`

### Action 列表

#### 1) `getPageSectionsAction(pageId, locale, defaultLocale)`

- **入参**：

```typescript
pageId: string; // uuid
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<SectionListItem[]>`

#### 2) `createSectionAction(input)`

- **入参**：

```typescript
{
  pageId: string; // uuid
  type: string; // <= 50
  placement?: 'main' | 'top' | 'bottom';
  config?: Record<string, unknown>;
  sortOrder?: number; // >= 0
  isActive?: boolean;
  anchorId?: string | null; // <= 100
  cssClass?: string | null; // <= 255
  translations: Array<{
    locale: string;
    title?: string;
    subtitle?: string;
    content?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<SectionWithTranslations>`

#### 3) `updateSectionAction(sectionId, input)`

- **入参**：

```typescript
sectionId: string; // uuid
input: {
  type?: string; // <= 50
  config?: Record<string, unknown>;
  sortOrder?: number; // >= 0
  isActive?: boolean;
  anchorId?: string | null; // <= 100
  cssClass?: string | null; // <= 255
  translations?: Array<{
    locale: string;
    title?: string;
    subtitle?: string;
    content?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<SectionWithTranslations>`

#### 4) `deleteSectionAction(sectionId)`

- **入参**：`sectionId: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 5) `reorderPageSectionsAction(input)`

- **入参**：

```typescript
{
  pageId: string; // uuid
  orderedSectionIds: string[]; // uuid[]
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

---

## 导航管理模块

文件：`src/server/actions/navigation.actions.ts`

### Action 列表

#### 1) `getNavigationListAction(locale, defaultLocale)`

- **入参**：

```typescript
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<NavigationListItem[]>`

#### 2) `createNavigationItemAction(input)`

- **入参**：

```typescript
{
  parentId?: string | null; // uuid
  type: 'internal' | 'external' | 'category' | 'page';
  url?: string | null; // internal/external 必填
  categoryId?: string | null; // category 必填
  pageId?: string | null; // page 必填
  showChildren?: boolean;
  icon?: string | null;
  openNewTab?: boolean;
  sortOrder?: number; // >= 0
  isActive?: boolean;
  translations: Array<{
    locale: string;
    label?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<NavigationWithTranslations>`
- **业务约束**：`translations` 至少一个 `label` 非空；链接目标字段需与 `type` 匹配

#### 3) `updateNavigationItemAction(id, input)`

- **入参**：

```typescript
id: string; // uuid
input: {
  parentId?: string | null; // uuid
  type?: 'internal' | 'external' | 'category' | 'page';
  url?: string | null;
  categoryId?: string | null;
  pageId?: string | null;
  showChildren?: boolean;
  icon?: string | null;
  openNewTab?: boolean;
  sortOrder?: number; // >= 0
  isActive?: boolean;
  translations?: Array<{
    locale: string;
    label?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<NavigationWithTranslations>`
- **业务约束**：不允许形成循环父子关系

#### 4) `deleteNavigationItemAction(id)`

- **入参**：`id: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`
- **业务约束**：有子菜单时不可删除

#### 5) `reorderNavigationTreeAction(input)`

- **入参**：

```typescript
{
  items: Array<{
    id: string; // uuid
    parentId: string | null; // uuid | null
    sortOrder: number; // >= 0
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

---

## 产品参数管理模块

文件：`src/server/actions/product-attribute.actions.ts`

### Action 列表

#### 1) `getProductOptionsAction(locale, defaultLocale)`

- **入参**：

```typescript
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<ProductOption[]>`

#### 2) `getProductAttributeEditorDataAction(productId, locale, defaultLocale)`

- **入参**：

```typescript
productId: string; // uuid
locale: string;
defaultLocale: string;
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<ProductAttributeEditorData>`

#### 3) `createAttributeGroupAction(input)`

- **入参**：

```typescript
{
  productId: string; // uuid
  sortOrder?: number;
  translations: Array<{
    locale: string;
    name?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 4) `updateAttributeGroupAction(groupId, input)`

- **入参**：

```typescript
groupId: string; // uuid
input: {
  sortOrder?: number;
  translations?: Array<{
    locale: string;
    name?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 5) `deleteAttributeGroupAction(groupId)`

- **入参**：`groupId: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 6) `createAttributeAction(input)`

- **入参**：

```typescript
{
  groupId: string; // uuid
  sortOrder?: number;
  translations: Array<{
    locale: string;
    name?: string;
    value?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 7) `updateAttributeAction(attributeId, input)`

- **入参**：

```typescript
attributeId: string; // uuid
input: {
  groupId?: string; // uuid
  sortOrder?: number;
  translations?: Array<{
    locale: string;
    name?: string;
    value?: string;
  }>;
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 8) `deleteAttributeAction(attributeId)`

- **入参**：`attributeId: string`（UUID）
- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 9) `reorderAttributeGroupsAction(productId, orderedGroupIds)`

- **入参**：

```typescript
productId: string; // uuid
orderedGroupIds: string[]; // uuid[]
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 10) `reorderAttributesAction(groupId, orderedAttributeIds)`

- **入参**：

```typescript
groupId: string; // uuid
orderedAttributeIds: string[]; // uuid[]
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 11) `moveAttributeToGroupAction(attributeId, targetGroupId)`

- **入参**：

```typescript
attributeId: string; // uuid
targetGroupId: string; // uuid
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<void>`

#### 12) `bulkImportAttributesAction(input)`

- **入参**：

```typescript
{
  productId: string; // uuid
  locale: string; // 导入写入的语言
  rows: Array<{
    group: string; // 分组名（已有同名则复用，否则新建）
    name: string; // 参数名
    value: string; // 参数值
  }>; // min 1
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<{ groupsCreated: number; attributesCreated: number }>`
- **说明**：批量导入参数（配合 CSV 前端解析），按分组名匹配复用已有分组

#### 13) `copyAttributesFromProductAction(input)`

- **入参**：

```typescript
{
  sourceProductId: string; // uuid，来源产品
  targetProductId: string; // uuid，目标产品
  copyValues: boolean; // true=连值一起复制, false=只复制结构（名称）
}
```

- **鉴权**：必须已登录后台
- **返回**：`ActionResult<{ groupsCopied: number; attributesCopied: number }>`
- **说明**：从来源产品复制参数分组+参数项+多语言翻译到目标产品（追加模式）

---

## 变更记录（续）

| 日期 | 变更 | 说明 |
|---|---|---|
| 2026-03 | 新增用户管理 Action 契约 | 收录用户列表、创建、启停用、重置密码 |
| 2026-03 | 用户管理契约更新 | 创建参数改为 `username`，新增 `updateUserProfileAction` |
| 2026-03 | 新增分类管理 Action 契约 | 收录分类列表、创建、更新、删除 |
| 2026-03 | 分类管理契约更新 | 新增树形排序 `reorderCategoryTreeAction` |
| 2026-03 | 新增标签管理 Action 契约 | 收录标签列表、创建、更新、删除 |
| 2026-03 | 新增产品管理 Action 契约 | 收录产品列表、创建、更新、删除（含状态生命周期） |
| 2026-03 | 新增页面管理 Action 契约 | 收录页面列表、创建、更新、删除（含首页标记约束） |
| 2026-03 | 新增区块管理 Action 契约 | 收录页面区块列表、创建、更新、删除、排序 |
| 2026-03 | 新增导航管理 Action 契约 | 收录导航列表、创建、更新、删除、树形重排 |
| 2026-03 | 新增产品参数管理 Action 契约 | 收录参数分组/参数项 CRUD、拖拽排序与跨组移动 |
| 2026-03-16 | 产品参数管理新增 CSV 导入与跨产品复制 | 新增 `bulkImportAttributesAction`、`copyAttributesFromProductAction` |

---

## 新增 Action 模板（复制使用）

> 新增 `*.actions.ts` 方法时，复制以下模板并补全字段。

```md
## 模块名

文件：`src/server/actions/xxx.actions.ts`

### Action 列表

#### 1) `actionName(input)`

- **入参**：

```typescript
{
  // 字段定义
}
```

- **返回**：`ActionResult<T>`
- **失败错误**：
  - `string`：业务错误
  - `Record<string, string[]>`：字段校验错误
```

---

## 新闻管理模块

> 文件：`server/actions/news.actions.ts`  
> 新增日期：2026-03-08

### 1) `getNewsListAction(params)` — 后台新闻列表（分页）

- **权限**：需登录
- **入参**：

```typescript
{
  locale: string;
  defaultLocale: string;
  page?: number;       // 默认 1
  pageSize?: number;   // 默认 20，最大 50
  search?: string;     // 按标题/Slug 模糊搜索
  status?: 'draft' | 'published' | 'all';  // 默认 all
}
```

- **返回**：

```typescript
{
  success: true,
  data: {
    items: Array<{
      id: string;
      slug: string;
      status: string;
      coverImage: { id: string; url: string; alt: string | null } | null;
      publishedAt: Date | null;
      title: string;
      summary: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
}
```

- **变更记录**：2026-03-10 从无分页改为分页 + 搜索 + 状态筛选

### 2) `getNewsByIdAction(id)` — 后台新闻详情

- **权限**：需登录
- **入参**：`id: string`（UUID）
- **返回**：

```typescript
{
  success: true,
  data: {
    id: string;
    slug: string;
    status: string;
    coverImageId: string | null;
    publishedAt: Date | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    tagIds: string[];
    translations: Array<{
      id: string;
      locale: string;
      title: string | null;
      summary: string | null;
      content: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
    }>;
  }
}
```

- **错误码**：`'Unauthorized'` / `'Invalid news id'` / `'News not found'`
- **变更记录**：2026-03-10 新增 `tagIds` 字段

### 3) `createNewsAction(input)` — 后台创建新闻

- **权限**：需登录
- **入参**：

```typescript
{
  slug: string;               // kebab-case
  status?: 'draft' | 'published';
  coverImageId?: string | null;
  publishedAt?: string | null;
  tagIds?: string[];          // UUID 数组
  translations: Array<{
    locale: string;
    title?: string;
    summary?: string;
    content?: string;         // 富文本 HTML
    seoTitle?: string;
    seoDescription?: string;
  }>;  // min 1
}
```

- **返回**：`{ success: true, data: { id: string } }` 或错误
- **变更记录**：2026-03-10 新增 `tagIds` 字段

### 4) `updateNewsAction(id, input)` — 后台更新新闻

- **权限**：需登录
- **入参**：`id: string`（UUID），`input` 同创建（所有字段可选）
- **返回**：`{ success: true, data: void }` 或错误
- **变更记录**：2026-03-10 新增 `tagIds` 字段

### 5) `deleteNewsAction(id)` — 后台删除新闻

- **权限**：需登录
- **入参**：`id: string`（UUID）
- **返回**：`{ success: true, data: void }` 或错误

---

## 询盘管理模块

> 文件：`server/actions/inquiry.actions.ts`  
> 新增日期：2026-03-08

### 1) `submitInquiryAction(input)` — 前台提交询盘

- **权限**：无需登录（公开接口）
- **入参**：

```typescript
{
  name: string;          // 1-200
  email: string;         // email 格式
  phone?: string;        // max 50
  company?: string;      // max 200
  country?: string;      // max 100
  message: string;       // 1-5000
  sourceUrl?: string;    // max 500
  locale?: string;
  deviceType?: string;
  products: Array<{
    productId?: string | null; // UUID（可为空，已删除产品）
    snapshot: { name: string; sku: string; imageUrl?: string };
    quantity: number;          // >= 1
  }>;
}
```

- **返回**：

```typescript
// 成功
{ success: true, data: { inquiryNumber: string } }
// 校验失败
{ success: false, error: Record<string, string[]> }
// 业务错误
{ success: false, error: string }
```

### 2) `getInquiryListAction(params)` — 后台询盘列表

- **权限**：需登录
- **入参**：

```typescript
{
  status?: 'new' | 'read' | 'closed' | 'spam';
  search?: string;
  page?: number;
  pageSize?: number;
}
```

- **返回**：

```typescript
{
  success: true,
  data: {
    items: Array<{
      id: string;
      inquiryNumber: string;
      name: string;
      email: string;
      company: string | null;
      country: string | null;
      status: string;
      productCount: number;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
}
```

### 3) `getInquiryDetailAction(id)` — 后台询盘详情

- **权限**：需登录
- **入参**：`id: string`（UUID）
- **返回**：

```typescript
{
  success: true,
  data: {
    id: string;
    inquiryNumber: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    country: string | null;
    message: string;
    status: string;
    sourceUrl: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    locale: string | null;
    deviceType: string | null;
    internalNotes: string | null;
    customFields: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    products: Array<{
      id: string;
      productId: string | null;
      snapshot: { name: string; sku: string; imageUrl?: string };
      quantity: number;
    }>;
  }
}
```

### 4) `updateInquiryStatusAction(id, status)` — 后台更新状态

- **权限**：需登录
- **入参**：`id: string`, `status: 'new' | 'read' | 'closed' | 'spam'`
- **返回**：`{ success: true, data: void }` 或 `{ success: false, error: string }`

### 5) `updateInquiryNotesAction(id, notes)` — 后台更新备注

- **权限**：需登录
- **入参**：`id: string`, `notes: string`
- **返回**：`{ success: true, data: void }` 或 `{ success: false, error: string }`

### 6) `batchUpdateInquiryStatusAction(ids, status)` — 后台批量更新状态

- **权限**：需登录
- **入参**：`ids: string[]`（UUID 数组）, `status: 'new' | 'read' | 'closed' | 'spam'`
- **返回**：`{ success: true, data: { count: number } }` 或 `{ success: false, error: string }`

### 7) `getInquiryStatsAction()` — 后台询盘统计

- **权限**：需登录
- **入参**：无
- **返回**：

```typescript
{
  success: true,
  data: {
    total: number;
    new: number;
    read: number;
    closed: number;
    spam: number;
  }
}
```

---

## UI 翻译管理模块

> 文件：`src/server/actions/ui-translation.actions.ts`

### 1) `getUiTranslationListAction(input)`

- **权限**：需管理员登录
- **入参**：
  ```typescript
  {
    category?: string;      // 按分类过滤
    search?: string;        // 搜索键名
    missingOnly?: boolean;  // 仅显示缺失翻译的键
    locale?: string;        // 检查特定语言的缺失
    page?: number;          // 页码（默认 1）
    pageSize?: number;      // 每页数量（默认 50，最大 200）
  }
  ```
- **返回**：`ActionResult<{ items: UiTranslationRow[]; total: number }>`

### 2) `getCategoriesAction()`

- **权限**：需管理员登录
- **入参**：无
- **返回**：`ActionResult<CategoryStat[]>`（含 category、keyCount、translatedCount、totalSlots）

### 3) `upsertTranslationAction(input)`

- **权限**：需管理员登录
- **入参**：
  ```typescript
  { key: string; category: string; translations: Record<string, string> }
  ```
- **返回**：`ActionResult<void>`

### 4) `createTranslationKeyAction(input)`

- **权限**：需管理员登录
- **入参**：
  ```typescript
  { key: string; translations: Record<string, string> }
  ```
  - key 格式：`category.keyName`（自动提取分类）
- **返回**：`ActionResult<void>`

### 5) `deleteTranslationKeyAction(input)`

- **权限**：需管理员登录
- **入参**：`{ key: string }`
- **返回**：`ActionResult<void>`

### 6) `renameTranslationKeyAction(input)`

- **权限**：需管理员登录
- **入参**：`{ oldKey: string; newKey: string }`
- **返回**：`ActionResult<void>`

---

## 主题管理模块

> 文件：`src/server/actions/theme.actions.ts`

### 1) `getThemeListAction()`

- **权限**：需管理员登录
- **入参**：无
- **返回**：`ActionResult<ThemeListItem[]>`

### 2) `createThemeAction(input)`

- **权限**：需管理员登录
- **入参**：
  ```typescript
  { name: string; config?: ThemeConfig }
  ```
- **返回**：`ActionResult<ThemeListItem>`

### 3) `updateThemeAction(input)`

- **权限**：需管理员登录
- **入参**：
  ```typescript
  { id: string; name?: string; config?: ThemeConfig }
  ```
- **返回**：`ActionResult<ThemeListItem>`

### 4) `activateThemeAction(input)`

- **权限**：需管理员登录
- **入参**：`{ id: string }`
- **返回**：`ActionResult<void>`
- **说明**：激活指定主题，自动停用其他主题

### 5) `deleteThemeAction(input)`

- **权限**：需管理员登录
- **入参**：`{ id: string }`
- **返回**：`ActionResult<void>`
- **约束**：预设主题和激活中的主题不可删除

---

## 系统设置模块

> 文件：`src/server/actions/settings.actions.ts`

### 1) `getSiteSettingsAction()`

- **权限**：需管理员登录
- **入参**：无
- **返回**：`ActionResult<SiteSettingsData>`（含全部站点设置 + 媒体 URL + 多语言翻译）

### 2) `updateSiteSettingsAction(input)`

- **权限**：需管理员登录
- **入参**：站点基础字段（logoId、contactEmail、socialFacebook 等，均可选）
- **返回**：`ActionResult<void>`

### 3) `updateSmtpSettingsAction(input)`

- **权限**：需管理员登录
- **入参**：SMTP 配置字段（smtpHost、smtpPort、smtpUser、smtpPassword、smtpFromName、smtpFromEmail、notificationEmails）
- **返回**：`ActionResult<void>`

### 4) `updateScriptsSettingsAction(input)`

- **权限**：需管理员登录
- **入参**：`{ gaId?, gtmId?, fbPixelId?, headScripts?, bodyScripts? }`
- **返回**：`ActionResult<void>`

### 5) `upsertSettingTranslationAction(input)`

- **权限**：需管理员登录
- **入参**：`{ locale, siteName?, siteDescription?, companyName?, slogan?, address?, footerText?, copyright?, contactCta?, seoKeywords?, inquiryAutoReplySubject?, inquiryAutoReplyBody?, announcementBarText? }`
- **返回**：`ActionResult<void>`

### 6) `sendTestEmailAction()`

- **权限**：需管理员登录
- **入参**：无
- **返回**：`ActionResult<void>`
- **说明**：发送测试邮件（当前为占位，待 nodemailer 集成）

---

## 重定向管理模块

> 文件：`src/server/actions/redirect.actions.ts`

### 1) `getRedirectListAction()`

- **权限**：需管理员登录
- **入参**：无
- **返回**：`ActionResult<Redirect[]>`

### 2) `createRedirectAction(input)`

- **权限**：需管理员登录
- **入参**：`{ fromPath: string, toPath: string, statusCode?: number, isActive?: boolean }`
- **返回**：`ActionResult<Redirect>`

### 3) `updateRedirectAction(input)`

- **权限**：需管理员登录
- **入参**：`{ id: number, fromPath?: string, toPath?: string, statusCode?: number, isActive?: boolean }`
- **返回**：`ActionResult<Redirect>`

### 4) `deleteRedirectAction(id)`

- **权限**：需管理员登录
- **入参**：`id: number`
- **返回**：`ActionResult<null>`

---

## 14. 导入导出 Actions（`export.actions.ts` / `import.actions.ts`）

### 1) `exportProductsCsvAction(defaultLocale)` — 导出产品 CSV

- **权限**：需登录
- **入参**：`defaultLocale: string`
- **返回**：`ActionResult<string>`（CSV 文本）
- **错误码**：`'Unauthorized'` / `'Failed to export products'`

### 2) `getProductCsvTemplateAction(defaultLocale)` — 下载导入模板

- **权限**：需登录
- **入参**：`defaultLocale: string`
- **返回**：`ActionResult<string>`（CSV 模板文本）
- **错误码**：`'Unauthorized'` / `'Failed to generate template'`

### 3) `exportInquiriesCsvAction()` — 导出询盘 CSV

- **权限**：需登录
- **入参**：无
- **返回**：`ActionResult<string>`（CSV 文本）
- **错误码**：`'Unauthorized'` / `'Failed to export inquiries'`

### 4) `previewProductCsvAction(csvText)` — 预览 CSV 导入

- **权限**：需登录
- **入参**：`csvText: string`
- **返回**：

```typescript
{
  success: true,
  data: {
    totalRows: number;
    validRows: number;
    errors: Array<{ row: number; field: string; message: string }>;
    rows: ImportRow[];
  }
}
```

- **错误码**：`'Unauthorized'` / `'Failed to parse CSV'`

### 5) `executeProductImportAction(csvText, mode)` — 确认执行导入

- **权限**：需登录
- **入参**：`csvText: string`, `mode: 'skip' | 'update'`（默认 `'skip'`）
- **返回**：

```typescript
{
  success: true,
  data: {
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  }
}
```

- **错误码**：`'Unauthorized'` / `'No valid rows to import'` / `'Failed to import products'`

---

## 废弃 Action 规范（Deprecated）

当 Action 进入弃用流程时，必须在本文档明确标记，格式如下：

```md
#### X) `oldActionName(...)`（DEPRECATED）

- **废弃状态**：Deprecated（保留兼容）
- **废弃日期**：YYYY-MM-DD
- **计划移除版本/日期**：vX.Y / YYYY-MM-DD
- **替代 Action**：`newActionName(...)`
- **迁移说明**：入参/返回差异、调用方改造步骤
```

> 约束：Deprecated Action 仅允许做兼容修复，不允许继续扩展新功能。

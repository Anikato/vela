'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Pencil,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getUiTranslationListAction,
  getCategoriesAction,
  upsertTranslationAction,
  createTranslationKeyAction,
  deleteTranslationKeyAction,
} from '@/server/actions/ui-translation.actions';
import type { UiTranslationListResult, CategoryStat } from '@/server/services/ui-translation-admin.service';

interface Language {
  code: string;
  name: string;
}

interface Props {
  initialCategories: CategoryStat[];
  initialData: UiTranslationListResult;
  languages: Language[];
}

export function UiTranslationManagement({ initialCategories, initialData, languages }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [data, setData] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editCategory, setEditCategory] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  const refreshList = useCallback(
    (opts?: { cat?: string | null; q?: string; missing?: boolean; p?: number }) => {
      const cat = opts?.cat !== undefined ? opts.cat : selectedCategory;
      const q = opts?.q !== undefined ? opts.q : search;
      const miss = opts?.missing !== undefined ? opts.missing : missingOnly;
      const pg = opts?.p ?? 1;

      startTransition(async () => {
        const res = await getUiTranslationListAction({
          category: cat ?? undefined,
          search: q || undefined,
          missingOnly: miss || undefined,
          page: pg,
          pageSize,
        });
        if (res.success) setData(res.data);
        const catRes = await getCategoriesAction();
        if (catRes.success) setCategories(catRes.data);
      });
    },
    [selectedCategory, search, missingOnly],
  );

  function handleCategoryClick(cat: string | null) {
    setSelectedCategory(cat);
    setPage(1);
    refreshList({ cat, p: 1 });
  }

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
    refreshList({ q, p: 1 });
  }

  function handleMissingToggle() {
    const next = !missingOnly;
    setMissingOnly(next);
    setPage(1);
    refreshList({ missing: next, p: 1 });
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    refreshList({ p: newPage });
  }

  function startEdit(key: string, category: string, translations: Record<string, string>) {
    setEditingKey(key);
    setEditCategory(category);
    setEditValues({ ...translations });
  }

  function handleSaveEdit() {
    if (!editingKey) return;
    startTransition(async () => {
      const res = await upsertTranslationAction({
        key: editingKey,
        category: editCategory,
        translations: editValues,
      });
      if (res.success) {
        setEditingKey(null);
        refreshList({ p: page });
      }
    });
  }

  function handleCreate() {
    if (!newKey.trim()) return;
    startTransition(async () => {
      const res = await createTranslationKeyAction({
        key: newKey.trim(),
        translations: newValues,
      });
      if (res.success) {
        setShowCreate(false);
        setNewKey('');
        setNewValues({});
        refreshList({ p: 1 });
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteTranslationKeyAction({ key: deleteTarget });
      if (res.success) {
        setDeleteTarget(null);
        refreshList({ p: page });
      }
    });
  }

  const totalKeys = categories.reduce((sum, c) => sum + c.keyCount, 0);
  const totalTranslated = categories.reduce((sum, c) => sum + c.translatedCount, 0);
  const totalSlots = categories.reduce((sum, c) => sum + c.totalSlots, 0);

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">UI 翻译管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {totalKeys} 个翻译键，总完成度{' '}
            {totalSlots > 0 ? Math.round((totalTranslated / totalSlots) * 100) : 0}%
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建翻译键
        </Button>
      </div>

      <div className="flex gap-6">
        {/* 左侧分类导航 */}
        <div className="w-56 shrink-0 space-y-1">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
            }`}
          >
            <span>全部</span>
            <span className="text-xs text-muted-foreground">{totalKeys}</span>
          </button>
          {categories.map((cat) => {
            const pct = cat.totalSlots > 0 ? Math.round((cat.translatedCount / cat.totalSlots) * 100) : 0;
            return (
              <button
                key={cat.category}
                onClick={() => handleCategoryClick(cat.category)}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  selectedCategory === cat.category
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span>{cat.category}</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`text-xs ${pct === 100 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}
                  >
                    {pct}%
                  </span>
                  <span className="text-xs text-muted-foreground">{cat.keyCount}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 右侧主内容 */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* 搜索 + 过滤 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索翻译键..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={missingOnly ? 'default' : 'outline'}
              size="sm"
              onClick={handleMissingToggle}
            >
              <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
              仅缺失
            </Button>
          </div>

          {/* 翻译列表 */}
          <div className="rounded-lg border bg-card">
            {data.items.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">暂无翻译键</div>
            ) : (
              <div className="divide-y">
                {data.items.map((item) => {
                  const isEditing = editingKey === item.key;
                  const missingLocales = languages.filter(
                    (l) => !item.translations[l.code]?.trim(),
                  );
                  const hasMissing = missingLocales.length > 0;

                  return (
                    <div key={item.key} className="p-4 space-y-2">
                      {/* Key 行 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                            {item.key}
                          </code>
                          {hasMissing && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              缺 {missingLocales.length} 语言
                            </span>
                          )}
                          {!hasMissing && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              完整
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingKey(null)}
                                disabled={isPending}
                              >
                                取消
                              </Button>
                              <Button size="sm" onClick={handleSaveEdit} disabled={isPending}>
                                <Save className="mr-1 h-3.5 w-3.5" />
                                保存
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  startEdit(item.key, item.category, item.translations)
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(item.key)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 翻译值 */}
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {languages.map((lang) => (
                            <div key={lang.code} className="flex items-center gap-2">
                              <span className="w-16 text-xs text-muted-foreground shrink-0 text-right">
                                {lang.name}
                              </span>
                              <Input
                                value={editValues[lang.code] ?? ''}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    [lang.code]: e.target.value,
                                  }))
                                }
                                placeholder={`${lang.code} 翻译值...`}
                                className="h-8 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {languages.map((lang) => {
                            const val = item.translations[lang.code];
                            return (
                              <span
                                key={lang.code}
                                className={`inline-flex items-center gap-1 text-xs rounded px-2 py-1 ${
                                  val?.trim()
                                    ? 'bg-muted text-foreground'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                <span className="font-medium">{lang.code}</span>
                                {val?.trim() ? (
                                  <span className="max-w-40 truncate">{val}</span>
                                ) : (
                                  <span className="italic">缺失</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                共 {data.total} 条，第 {page}/{totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新建翻译键对话框 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建翻译键</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">翻译键</label>
              <Input
                placeholder="例：product.addToInquiry"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                格式：category.keyName，点号前的部分自动作为分类
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">翻译值</label>
              {languages.map((lang) => (
                <div key={lang.code} className="flex items-center gap-2">
                  <span className="w-20 text-sm text-muted-foreground shrink-0 text-right">
                    {lang.name}
                  </span>
                  <Input
                    value={newValues[lang.code] ?? ''}
                    onChange={(e) =>
                      setNewValues((prev) => ({ ...prev, [lang.code]: e.target.value }))
                    }
                    placeholder={`${lang.code} ...`}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!newKey.trim() || isPending}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除翻译键{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded">{deleteTarget}</code>{' '}
            及其所有语言翻译吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

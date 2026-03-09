'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  exportProductsCsvAction,
  getProductCsvTemplateAction,
  exportInquiriesCsvAction,
} from '@/server/actions/export.actions';
import {
  previewProductCsvAction,
  executeProductImportAction,
} from '@/server/actions/import.actions';
import type { ImportPreviewResult, ImportResult } from '@/server/services/product-import.service';

interface DataManagementProps {
  defaultLocale: string;
}

function downloadCsv(content: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataManagement({ defaultLocale }: DataManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'skip' | 'update'>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExportProducts() {
    setActiveAction('export-products');
    startTransition(async () => {
      const result = await exportProductsCsvAction(defaultLocale);
      if (result.success) {
        downloadCsv(result.data, `products-${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success('产品数据已导出');
      } else {
        toast.error(result.error as string);
      }
      setActiveAction(null);
    });
  }

  function handleExportInquiries() {
    setActiveAction('export-inquiries');
    startTransition(async () => {
      const result = await exportInquiriesCsvAction();
      if (result.success) {
        downloadCsv(result.data, `inquiries-${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success('询盘数据已导出');
      } else {
        toast.error(result.error as string);
      }
      setActiveAction(null);
    });
  }

  function handleDownloadTemplate() {
    setActiveAction('template');
    startTransition(async () => {
      const result = await getProductCsvTemplateAction(defaultLocale);
      if (result.success) {
        downloadCsv(result.data, 'product-import-template.csv');
        toast.success('模板已下载');
      } else {
        toast.error(result.error as string);
      }
      setActiveAction(null);
    });
  }

  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setPreview(null);
      setImportResult(null);

      setActiveAction('preview');
      startTransition(async () => {
        const result = await previewProductCsvAction(text);
        if (result.success) {
          setPreview(result.data);
        } else {
          toast.error(result.error as string);
        }
        setActiveAction(null);
      });
    };
    reader.readAsText(file);
  }

  function handleConfirmImport() {
    if (!csvText) return;

    setActiveAction('import');
    startTransition(async () => {
      const result = await executeProductImportAction(csvText, importMode);
      if (result.success) {
        setImportResult(result.data);
        toast.success(
          `导入完成：新建 ${result.data.created}，更新 ${result.data.updated}，跳过 ${result.data.skipped}`,
        );
      } else {
        toast.error(result.error as string);
      }
      setActiveAction(null);
    });
  }

  function resetImport() {
    setPreview(null);
    setImportResult(null);
    setCsvText(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">导入导出</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          产品和询盘数据的 CSV 导入导出
        </p>
      </div>

      {/* 导出区域 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">数据导出</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="font-medium">产品数据</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              导出所有产品及多语言翻译为 CSV 文件
            </p>
            <Button
              onClick={handleExportProducts}
              disabled={isPending}
              variant="outline"
              className="w-full"
            >
              {activeAction === 'export-products' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              导出产品 CSV
            </Button>
          </div>

          <div className="rounded-md border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="font-medium">询盘数据</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              导出所有询盘记录为 CSV 文件
            </p>
            <Button
              onClick={handleExportInquiries}
              disabled={isPending}
              variant="outline"
              className="w-full"
            >
              {activeAction === 'export-inquiries' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              导出询盘 CSV
            </Button>
          </div>
        </div>
      </div>

      {/* 导入区域 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">产品导入</h2>

        <div className="mb-4 flex flex-wrap gap-3">
          <Button
            onClick={handleDownloadTemplate}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            {activeAction === 'template' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            下载导入模板
          </Button>

          <Button
            onClick={handleFileSelect}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            选择 CSV 文件
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* 预览结果 */}
        {preview && !importResult && (
          <div className="space-y-4">
            <div className="rounded-md border border-border p-4">
              <h3 className="mb-2 font-medium">预览结果</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">总行数：</span>
                  <span className="font-mono">{preview.totalRows}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">有效行：</span>
                  <span className="font-mono text-green-500">{preview.validRows}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">错误数：</span>
                  <span className="font-mono text-red-500">{preview.errors.length}</span>
                </div>
              </div>
            </div>

            {preview.errors.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  校验错误
                </h4>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                  {preview.errors.map((err, i) => (
                    <li key={i} className="text-destructive/80">
                      第 {err.row} 行{err.field ? ` [${err.field}]` : ''}：{err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.validRows > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">冲突处理：</label>
                  <Select value={importMode} onValueChange={(v) => setImportMode(v as 'skip' | 'update')}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">跳过已存在</SelectItem>
                      <SelectItem value="update">覆盖已存在</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleConfirmImport}
                  disabled={isPending}
                  size="sm"
                >
                  {activeAction === 'import' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  确认导入 {preview.validRows} 条
                </Button>
                <Button
                  onClick={resetImport}
                  variant="ghost"
                  size="sm"
                >
                  取消
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 导入结果 */}
        {importResult && (
          <div className="rounded-md border border-green-500/30 bg-green-500/5 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 font-medium text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              导入完成
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">新建：</span>
                <span className="font-mono">{importResult.created}</span>
              </div>
              <div>
                <span className="text-muted-foreground">更新：</span>
                <span className="font-mono">{importResult.updated}</span>
              </div>
              <div>
                <span className="text-muted-foreground">跳过：</span>
                <span className="font-mono">{importResult.skipped}</span>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-destructive">
                  部分行导入失败（{importResult.errors.length}）
                </h4>
                <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-xs text-destructive/80">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>第 {err.row} 行：{err.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={resetImport} variant="outline" size="sm" className="mt-3">
              重新导入
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

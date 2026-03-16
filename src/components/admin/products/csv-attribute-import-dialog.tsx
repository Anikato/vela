'use client';

import { useCallback, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { FileUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { bulkImportAttributesAction } from '@/server/actions/product-attribute.actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CsvRow {
  id: string;
  group: string;
  name: string;
  value: string;
}

interface CsvAttributeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  defaultLocale: string;
  onImported: () => void;
}

let rowIdCounter = 0;

function makeRowId(): string {
  return `csv-row-${++rowIdCounter}`;
}

export function CsvAttributeImportDialog({
  open,
  onOpenChange,
  productId,
  defaultLocale,
  onImported,
}: CsvAttributeImportDialogProps) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const stats = useMemo(() => {
    const groups = new Set(rows.map((r) => r.group));
    return { groups: groups.size, attributes: rows.length };
  }, [rows]);

  const handleFile = useCallback((file: File) => {
    setParseError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length > 0) {
          setParseError(`CSV 解析错误：${results.errors[0].message}`);
          return;
        }

        const headers = results.meta.fields ?? [];
        const hasGroup = headers.some((h) => h.toLowerCase() === 'group');
        const hasName = headers.some((h) => h.toLowerCase() === 'name');
        const hasValue = headers.some((h) => h.toLowerCase() === 'value');

        if (!hasGroup || !hasName || !hasValue) {
          setParseError('CSV 表头必须包含 group、name、value 三列');
          return;
        }

        const groupKey = headers.find((h) => h.toLowerCase() === 'group')!;
        const nameKey = headers.find((h) => h.toLowerCase() === 'name')!;
        const valueKey = headers.find((h) => h.toLowerCase() === 'value')!;

        const parsed: CsvRow[] = results.data
          .map((row) => ({
            id: makeRowId(),
            group: (row[groupKey] ?? '').trim(),
            name: (row[nameKey] ?? '').trim(),
            value: (row[valueKey] ?? '').trim(),
          }))
          .filter((r) => r.group && r.name);

        if (parsed.length === 0) {
          setParseError('CSV 中没有有效数据行（分组名和参数名不能为空）');
          return;
        }

        setRows(parsed);
      },
      error(err: Error) {
        setParseError(`文件读取失败：${err.message}`);
      },
    });
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function updateRow(id: string, field: keyof Omit<CsvRow, 'id'>, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const result = await bulkImportAttributesAction({
        productId,
        locale: defaultLocale,
        rows: rows.map((r) => ({ group: r.group, name: r.name, value: r.value })),
      });
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '导入失败');
        return;
      }
      toast.success(`已创建 ${result.data.groupsCreated} 个分组、${result.data.attributesCreated} 个参数`);
      setRows([]);
      onOpenChange(false);
      onImported();
    } finally {
      setImporting(false);
    }
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setRows([]);
      setParseError(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>CSV 导入参数</DialogTitle>
          <DialogDescription>
            上传 CSV 文件（表头：group, name, value），将导入为 <strong>{defaultLocale}</strong> 语言的参数，其他语言可后续编辑。
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/50 p-10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <FileUp className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              拖拽 CSV 文件到此处，或
            </p>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>选择文件</span>
              </Button>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleInputChange}
              />
            </label>
            {parseError && (
              <p className="mt-2 text-sm text-destructive">{parseError}</p>
            )}
            <div className="mt-4 rounded-md bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium">CSV 格式示例：</p>
              <pre className="whitespace-pre">
{`group,name,value
General Specifications,Power,5.5 kW
General Specifications,Voltage,380V
Dimensions,Length,1200mm`}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                共 {stats.groups} 个分组、{stats.attributes} 个参数
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRows([])}
              >
                重新上传
              </Button>
            </div>
            <div className="rounded-md border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium">分组名</th>
                    <th className="px-3 py-2 text-left font-medium">参数名</th>
                    <th className="px-3 py-2 text-left font-medium">参数值</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/30 last:border-0">
                      <td className="px-2 py-1.5">
                        <Input
                          value={row.group}
                          onChange={(e) => updateRow(row.id, 'group', e.target.value)}
                          className="h-8 text-xs"
                          disabled={importing}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={row.name}
                          onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                          className="h-8 text-xs"
                          disabled={importing}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={row.value}
                          onChange={(e) => updateRow(row.id, 'value', e.target.value)}
                          className="h-8 text-xs"
                          disabled={importing}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteRow(row.id)}
                          disabled={importing}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={importing || rows.length === 0}>
            确认导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

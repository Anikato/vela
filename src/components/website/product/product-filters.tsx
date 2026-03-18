'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { PublicTagItem, ProductSortOption } from '@/types/website';

interface TagFilterProps {
  tags: PublicTagItem[];
  activeTagSlug?: string;
  basePath: string;
}

export function TagFilter({ tags, activeTagSlug, basePath }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildHref = useCallback(
    (tagSlug?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      if (tagSlug) {
        params.set('tag', tagSlug);
      } else {
        params.delete('tag');
      }
      const qs = params.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [searchParams, basePath],
  );

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => {
        const isActive = activeTagSlug === tag.slug;
        return (
          <button
            key={tag.id}
            onClick={() => router.push(buildHref(isActive ? undefined : tag.slug))}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {tag.name}
            <span className="text-xs opacity-60">({tag.productCount})</span>
            {isActive ? <X className="h-3 w-3" /> : null}
          </button>
        );
      })}
    </div>
  );
}

interface SortSelectProps {
  currentSort: ProductSortOption;
  basePath: string;
  labels: {
    newest: string;
    popular: string;
    nameAsc: string;
    nameDesc: string;
  };
}

export function SortSelect({ currentSort, basePath, labels }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      if (value && value !== 'newest') {
        params.set('sort', value);
      } else {
        params.delete('sort');
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [searchParams, basePath, router],
  );

  const options: Array<{ value: ProductSortOption; label: string }> = [
    { value: 'newest', label: labels.newest },
    { value: 'popular', label: labels.popular },
    { value: 'name_asc', label: labels.nameAsc },
    { value: 'name_desc', label: labels.nameDesc },
  ];

  return (
    <select
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48];

interface PageSizeSelectProps {
  currentPageSize: number;
  basePath: string;
  label: string;
}

export function PageSizeSelect({ currentPageSize, basePath, label }: PageSizeSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      const size = Number(value);
      if (size && size !== 12) {
        params.set('pageSize', value);
      } else {
        params.delete('pageSize');
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [searchParams, basePath, router],
  );

  return (
    <select
      value={currentPageSize}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
    >
      {PAGE_SIZE_OPTIONS.map((n) => (
        <option key={n} value={n}>
          {label.replace('{n}', String(n))}
        </option>
      ))}
    </select>
  );
}

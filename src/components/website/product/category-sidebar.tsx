'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';

import { buildLocalizedPath } from '@/lib/i18n';
import type { PublicCategoryTreeNode } from '@/server/services/product-public.service';

interface CategorySidebarProps {
  tree: PublicCategoryTreeNode[];
  locale: string;
  defaultLocale: string;
  currentCategorySlug: string;
  currentProductSlug: string;
  title: string;
}

function findExpandedSlugs(
  nodes: PublicCategoryTreeNode[],
  targetSlug: string,
  path: string[] = [],
): string[] | null {
  for (const node of nodes) {
    if (node.slug === targetSlug) return [...path, node.slug];
    if (node.children.length > 0) {
      const found = findExpandedSlugs(node.children, targetSlug, [...path, node.slug]);
      if (found) return found;
    }
  }
  return null;
}

export function CategorySidebar({
  tree,
  locale,
  defaultLocale,
  currentCategorySlug,
  currentProductSlug,
  title,
}: CategorySidebarProps) {
  const initialExpanded = new Set(findExpandedSlugs(tree, currentCategorySlug) ?? [currentCategorySlug]);
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  function toggle(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }

  return (
    <nav className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <FolderOpen className="h-4 w-4" />
        {title}
      </h3>
      <div className="space-y-0.5">
        {tree.map((node) => (
          <CategoryNode
            key={node.id}
            node={node}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            locale={locale}
            defaultLocale={defaultLocale}
            currentCategorySlug={currentCategorySlug}
            currentProductSlug={currentProductSlug}
          />
        ))}
      </div>
    </nav>
  );
}

interface CategoryNodeProps {
  node: PublicCategoryTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (slug: string) => void;
  locale: string;
  defaultLocale: string;
  currentCategorySlug: string;
  currentProductSlug: string;
}

function CategoryNode({
  node,
  depth,
  expanded,
  onToggle,
  locale,
  defaultLocale,
  currentCategorySlug,
  currentProductSlug,
}: CategoryNodeProps) {
  const isExpanded = expanded.has(node.slug);
  const hasChildren = node.children.length > 0;
  const isActive = node.slug === currentCategorySlug;
  const href = buildLocalizedPath(`/products/${node.slug}`, locale, defaultLocale);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors ${
          isActive
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.slug)}
            className="shrink-0 rounded p-0.5 hover:bg-muted"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}
        <Link href={href} className="flex-1 truncate">
          {node.name}
        </Link>
        <span className="shrink-0 text-xs text-muted-foreground">{node.productCount}</span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              locale={locale}
              defaultLocale={defaultLocale}
              currentCategorySlug={currentCategorySlug}
              currentProductSlug={currentProductSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

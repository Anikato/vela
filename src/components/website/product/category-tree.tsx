'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { PublicCategoryTreeNode } from '@/server/services/product-public.service';

interface CategoryTreeProps {
  tree: PublicCategoryTreeNode[];
  basePath: string;
  activeCategorySlug?: string;
  allProductsLabel: string;
  totalProductCount: number;
}

export function CategoryTree({
  tree,
  basePath,
  activeCategorySlug,
  allProductsLabel,
  totalProductCount,
}: CategoryTreeProps) {
  return (
    <nav>
      <ul className="space-y-0.5">
        <li>
          <Link
            href={basePath}
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-sm transition',
              !activeCategorySlug
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-foreground/80 hover:bg-accent',
            )}
          >
            <span>{allProductsLabel}</span>
            <span className="text-xs text-muted-foreground">{totalProductCount}</span>
          </Link>
        </li>
        {tree.map((node) => (
          <CategoryTreeNode
            key={node.id}
            node={node}
            basePath={basePath}
            activeCategorySlug={activeCategorySlug}
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
}

interface CategoryTreeNodeProps {
  node: PublicCategoryTreeNode;
  basePath: string;
  activeCategorySlug?: string;
  depth: number;
}

function CategoryTreeNode({ node, basePath, activeCategorySlug, depth }: CategoryTreeNodeProps) {
  const isActive = activeCategorySlug === node.slug;
  const hasActiveChild = activeCategorySlug
    ? hasDescendantSlug(node, activeCategorySlug)
    : false;
  const [expanded, setExpanded] = useState(isActive || hasActiveChild);

  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-7 shrink-0" />
        )}
        <Link
          href={`${basePath}/${node.slug}`}
          className={cn(
            'flex flex-1 items-center justify-between rounded-md px-2 py-2 text-sm transition',
            isActive
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-foreground/80 hover:bg-accent',
          )}
        >
          <span className="line-clamp-1">{node.name}</span>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">{node.productCount}</span>
        </Link>
      </div>

      {hasChildren && expanded ? (
        <ul className="ml-3 space-y-0.5 border-l border-border/50 pl-1">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              basePath={basePath}
              activeCategorySlug={activeCategorySlug}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function hasDescendantSlug(node: PublicCategoryTreeNode, slug: string): boolean {
  for (const child of node.children) {
    if (child.slug === slug) return true;
    if (hasDescendantSlug(child, slug)) return true;
  }
  return false;
}

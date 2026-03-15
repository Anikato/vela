import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const LOCALE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

/** 从浏览器 pathname 提取 locale（如 /zh-CN/products → zh-CN；/ → undefined） */
export function getLocaleFromPathname(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  return seg && LOCALE_RE.test(seg) ? seg : undefined;
}

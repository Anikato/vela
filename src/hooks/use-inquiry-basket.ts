'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

export interface InquiryBasketItem {
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  quantity: number;
}

const STORAGE_KEY = 'vela_inquiry_basket';

let listeners: Array<() => void> = [];
let cachedItems: InquiryBasketItem[] | null = null;

function notifyListeners() {
  cachedItems = null;
  for (const listener of listeners) listener();
}

function readItems(): InquiryBasketItem[] {
  if (cachedItems !== null) return cachedItems;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cachedItems = raw ? (JSON.parse(raw) as InquiryBasketItem[]) : [];
  } catch {
    cachedItems = [];
  }
  return cachedItems;
}

function writeItems(items: InquiryBasketItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded — silently ignore */ }
  notifyListeners();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): InquiryBasketItem[] {
  return readItems();
}

const EMPTY_ITEMS: InquiryBasketItem[] = [];
function getServerSnapshot(): InquiryBasketItem[] {
  return EMPTY_ITEMS;
}

export function useInquiryBasket() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: Omit<InquiryBasketItem, 'quantity'>, quantity = 1) => {
    const current = readItems();
    const existing = current.find((i) => i.productId === item.productId);
    if (existing) {
      writeItems(
        current.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        ),
      );
    } else {
      writeItems([...current, { ...item, quantity }]);
    }
  }, []);

  const removeItem = useCallback((productId: string) => {
    writeItems(readItems().filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const safeQty = Math.max(1, quantity);
    writeItems(
      readItems().map((i) => (i.productId === productId ? { ...i, quantity: safeQty } : i)),
    );
  }, []);

  const clearBasket = useCallback(() => {
    writeItems([]);
  }, []);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, totalCount, addItem, removeItem, updateQuantity, clearBasket };
}

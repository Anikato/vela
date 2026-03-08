'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { InquiryBasketTrigger } from '@/components/website/inquiry/inquiry-basket-drawer';

interface HeaderActionsProps {
  searchPath: string;
  uiLabels: {
    searchPlaceholder: string;
    basketTitle: string;
    basketEmpty: string;
    basketSubmit: string;
    basketClear: string;
    basketClose: string;
    formTitle: string;
    formName: string;
    formEmail: string;
    formPhone: string;
    formCompany: string;
    formCountry: string;
    formMessage: string;
    formSubmit: string;
    formCancel: string;
    formSuccess: string;
    formError: string;
  };
}

export function HeaderActions({ searchPath, uiLabels }: HeaderActionsProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchValue.trim();
      if (!q) return;
      setSearchOpen(false);
      setSearchValue('');
      router.push(`${searchPath}?q=${encodeURIComponent(q)}`);
    },
    [searchValue, searchPath, router],
  );

  return (
    <div className="flex items-center gap-1.5">
      {/* Search toggle */}
      <div className="relative">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {searchOpen ? (
          <form
            onSubmit={handleSearch}
            className="absolute right-0 top-full mt-2 flex w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-md sm:w-72"
          >
            <input
              type="text"
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={uiLabels.searchPlaceholder}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              className="px-3 text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        ) : null}
      </div>

      {/* Inquiry basket */}
      <InquiryBasketTrigger
        uiLabels={{
          title: uiLabels.basketTitle,
          empty: uiLabels.basketEmpty,
          submitInquiry: uiLabels.basketSubmit,
          clearAll: uiLabels.basketClear,
          close: uiLabels.basketClose,
        }}
        formLabels={{
          title: uiLabels.formTitle,
          name: uiLabels.formName,
          email: uiLabels.formEmail,
          phone: uiLabels.formPhone,
          company: uiLabels.formCompany,
          country: uiLabels.formCountry,
          message: uiLabels.formMessage,
          submit: uiLabels.formSubmit,
          cancel: uiLabels.formCancel,
          success: uiLabels.formSuccess,
          error: uiLabels.formError,
        }}
      />
    </div>
  );
}

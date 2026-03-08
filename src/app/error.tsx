'use client';

import { useEffect } from 'react';

/**
 * Root error boundary — must be a Client Component (Next.js constraint).
 * When this renders, the server/DB may be unavailable, so translation
 * fetching could fail. English fallback is the safe default.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-8xl font-bold text-destructive/20">500</p>
        <h1 className="mt-4 text-2xl font-bold">Something Went Wrong</h1>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. Please try again later.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

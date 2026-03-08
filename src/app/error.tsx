'use client';

import { useEffect } from 'react';

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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-destructive/20">500</p>
        <h1 className="text-2xl font-bold mt-4">Something Went Wrong</h1>
        <p className="text-muted-foreground mt-2">
          An unexpected error occurred. Please try again later.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
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

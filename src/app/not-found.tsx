import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-primary/20">404</p>
        <h1 className="text-2xl font-bold mt-4">Page Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}

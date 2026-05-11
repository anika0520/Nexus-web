import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  Link,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { ThemeManager } from "@/components/ThemeManager";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center gradient-mesh px-4">
      <div className="glass rounded-2xl p-10 text-center max-w-md">
        <div className="font-display text-7xl font-bold gradient-text">404</div>
        <h2 className="mt-3 text-lg font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for has drifted away.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-xl gradient-primary text-primary-foreground px-5 h-10 text-sm font-medium shadow-[var(--shadow-glow)]">
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="max-w-md text-center glass rounded-2xl p-8">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-5 inline-flex items-center rounded-xl gradient-primary text-primary-foreground px-5 h-10 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeManager />
      <Outlet />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          className: "!glass-strong !rounded-xl !text-foreground !border-border",
        }}
      />
    </QueryClientProvider>
  );
}

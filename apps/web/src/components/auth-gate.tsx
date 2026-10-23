"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe, isUnauthorized } from "@/lib/auth";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import { Skeleton } from "./ui/skeleton";

export function AuthGate({ children }: { children: ReactNode }) {
  const { data, error, isPending, refetch } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleUnauthorized(): void {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
    window.addEventListener("taskflow:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("taskflow:unauthorized", handleUnauthorized);
  }, [pathname, router]);

  useEffect(() => {
    if (isUnauthorized(error)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [error, pathname, router]);

  if (isPending) {
    return (
      <div className="min-h-dvh bg-background p-6">
        <div className="mx-auto max-w-5xl">
          <Logo />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !isUnauthorized(error)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 text-xl font-semibold leading-7">
            Cannot reach TaskFlow
          </h1>
          <p className="mt-2 text-sm leading-5 text-muted">
            The API is not responding. Check that the server is running, then try
            again.
          </p>
          <Button className="mt-6" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-dvh bg-background" />;
  }

  return children;
}

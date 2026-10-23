import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in · TaskFlow",
};

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginView />
    </Suspense>
  );
}

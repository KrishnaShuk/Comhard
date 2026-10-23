"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
  type SessionUser,
} from "@taskflow/shared";
import { ApiError } from "@/lib/api";
import { authRequest, useAuthStatus, useMe } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function safeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/board";
}

function RootError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2">
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-muted"
      />
      <p role="alert" className="text-sm leading-5">
        {message}
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs font-medium leading-4">
      {message}
    </p>
  );
}

function useAuthSuccess(next: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return (user: SessionUser) => {
    queryClient.setQueryData(queryKeys.me, user);
    void queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
    router.replace(next);
  };
}

function LoginForm({ next }: { next: string }) {
  const onSuccess = useAuthSuccess(next);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const login = useMutation({
    mutationFn: (values: LoginInput) => authRequest("login", values),
    onSuccess,
  });

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={form.handleSubmit((values) =>
        login.mutate(values, {
          onError: (error) => {
            form.setError("root", { type: "server", message: "Email or password is incorrect" });
            if (error instanceof ApiError) {
              if (error.fields?.email) {
                form.setError("email", { type: "server", message: error.fields.email });
              }
              if (error.fields?.password) {
                form.setError("password", {
                  type: "server",
                  message: error.fields.password,
                });
              }
            }
          },
        }),
      )}
    >
      <RootError message={form.formState.errors.root?.message} />

      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          className="mt-1.5"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className="mt-1.5"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        Sign in
      </Button>
    </form>
  );
}

function SetupForm({ next }: { next: string }) {
  const onSuccess = useAuthSuccess(next);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const register = useMutation({
    mutationFn: (values: RegisterInput) => authRequest("register", values),
    onSuccess,
  });

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={form.handleSubmit((values) =>
        register.mutate(values, {
          onError: (error) => {
            if (!(error instanceof ApiError)) return;
            form.setError("root", { type: "server", message: error.message });
            for (const [key, message] of Object.entries(error.fields ?? {})) {
              if (key === "name" || key === "email" || key === "password") {
                form.setError(key, { type: "server", message });
              }
            }
          },
        }),
      )}
    >
      <RootError message={form.formState.errors.root?.message} />

      <div>
        <Label htmlFor="setup-name">Name</Label>
        <Input
          id="setup-name"
          autoComplete="name"
          autoFocus
          className="mt-1.5"
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register("name")}
        />
        <FieldError message={form.formState.errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="setup-email">Email</Label>
        <Input
          id="setup-email"
          type="email"
          autoComplete="email"
          className="mt-1.5"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="setup-password">Password</Label>
        <Input
          id="setup-password"
          type="password"
          autoComplete="new-password"
          className="mt-1.5"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        <p className="mt-1 text-xs leading-4 text-muted">Use at least 10 characters.</p>
        <FieldError message={form.formState.errors.password?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={register.isPending}>
        {register.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        Create workspace
      </Button>
    </form>
  );
}

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const me = useMe();
  const status = useAuthStatus();

  useEffect(() => {
    if (me.data) router.replace(next);
  }, [me.data, next, router]);

  if (me.isPending || status.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (status.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <Logo className="justify-center" />
          <p className="mt-6 text-sm leading-5 text-muted">
            Cannot reach the TaskFlow API. Start the server and reload this page.
          </p>
          <Button className="mt-4" onClick={() => void status.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (me.data) return null;

  const needsSetup = status.data?.needsSetup ?? false;

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-xl font-semibold leading-7 tracking-tight">
          {needsSetup ? "Create your workspace" : "Sign in to TaskFlow"}
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted">
          {needsSetup
            ? "TaskFlow is single-user. This account will own the workspace."
            : "Pick up where you left off."}
        </p>

        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          {needsSetup ? <SetupForm next={next} /> : <LoginForm next={next} />}
        </div>

        <p className="mt-4 text-center text-xs leading-4 text-muted">
          Status changes stay in the task history.
        </p>
      </div>
    </div>
  );
}

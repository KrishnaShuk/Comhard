"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "@taskflow/shared";
import { ApiError, api } from "./api";
import { queryKeys } from "./query-keys";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () =>
      api
        .get<{ data: SessionUser }>("/auth/me")
        .then((response) => response.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuthStatus() {
  return useQuery({
    queryKey: queryKeys.authStatus,
    queryFn: () =>
      api
        .get<{ data: { needsSetup: boolean } }>("/auth/status")
        .then((response) => response.data),
    retry: false,
    staleTime: 30_000,
  });
}

export async function authRequest(
  mode: "login" | "register",
  body: unknown,
): Promise<SessionUser> {
  const response = await api.post<{ data: SessionUser }>(`/auth/${mode}`, body);
  return response.data;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

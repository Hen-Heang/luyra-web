// Thin fetch wrapper shared by every lib/api/* module. Components never call
// fetch() or a repository/service directly — they go through here. When the
// backend becomes Spring Boot, only this file (and the base URL) changes;
// components and their lib/api/* calls stay the same.

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await response.json();

  if (!response.ok) {
    const { code, message } = (body as ApiErrorBody).error;
    throw new ApiError(code, message);
  }

  return (body as { data: T }).data;
}

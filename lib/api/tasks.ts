import { apiFetch } from "@/lib/api/client";
import type { CreateTaskInput } from "@/lib/validation/task";
import type { Task } from "@/types/task";

export function createTask(input: CreateTaskInput): Promise<Task> {
  return apiFetch<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

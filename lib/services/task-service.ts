import "server-only";
import { createTask, findTasksByUser } from "@/lib/repositories/task-repository";
import type { CreateTaskInput, TaskFilters } from "@/lib/validation/task";
import type { Task } from "@/types/task";

export async function listTasks(userId: string, filters: TaskFilters): Promise<Task[]> {
  return findTasksByUser(userId, filters);
}

export async function addTask(userId: string, input: CreateTaskInput): Promise<Task> {
  return createTask(userId, input);
}

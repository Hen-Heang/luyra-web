export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: () => new AppError("UNAUTHORIZED", "Authentication required", 401),
  notFound: (resource: string) => new AppError("NOT_FOUND", `${resource} not found`, 404),
  validation: (message: string) => new AppError("VALIDATION_ERROR", message, 422),
};

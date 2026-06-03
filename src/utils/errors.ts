import { ErrorCode } from "../types";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = "ValidationError";
  }
}

export class CourierError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(code, message, statusCode, details);
    this.name = "CourierError";
  }
}

export class UnknownCourierError extends CourierError {
  constructor(courierName: string) {
    super(
      ErrorCode.UNKNOWN_COURIER,
      `Unknown courier: ${courierName}`,
      400,
      { courier: courierName }
    );
    this.name = "UnknownCourierError";
  }
}

export class CourierAuthError extends CourierError {
  constructor(message: string = "Courier authentication failed") {
    super(
      ErrorCode.COURIER_AUTH_FAILED,
      message,
      401
    );
    this.name = "CourierAuthError";
  }
}

export class CourierTimeoutError extends CourierError {
  constructor(courierName: string, timeout: number) {
    super(
      ErrorCode.COURIER_TIMEOUT,
      `Courier ${courierName} request timed out after ${timeout}ms`,
      504,
      { courier: courierName, timeout }
    );
    this.name = "CourierTimeoutError";
  }
}

export class CourierApiError extends CourierError {
  constructor(
    courierName: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(
      ErrorCode.COURIER_API_ERROR,
      `${courierName} API error: ${message}`,
      statusCode,
      { courier: courierName, ...details }
    );
    this.name = "CourierApiError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(ErrorCode.FORBIDDEN, message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class DuplicateOrderError extends AppError {
  constructor(orderId: string) {
    super(
      ErrorCode.DUPLICATE_ORDER,
      `Order ${orderId} already exists`,
      409,
      { orderId }
    );
    this.name = "DuplicateOrderError";
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function isAxiosError(error: any): boolean {
  return error.response && error.config && error.request;
}

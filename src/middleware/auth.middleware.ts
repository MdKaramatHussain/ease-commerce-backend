import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { JwtPayload, UserRole } from "../types";
import { loggerService } from "../services/logger.service";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  requestId?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("Missing authorization token");
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      loggerService.warn("Token expired", { token: error.message });
      res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Token has expired",
        },
      });
    } else {
      loggerService.error("Auth middleware error", error as Error);
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authorization token",
        },
      });
    }
  }
};

export const roleMiddleware = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError("User not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `User role ${req.user.role} is not authorized for this resource`
      );
    }

    next();
  };
};

export const requestIdMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  req.requestId =
    req.headers["x-request-id"] as string ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader("X-Request-ID", req.requestId);
  next();
};

export const errorHandlingMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  loggerService.error("Error caught by middleware", err, {
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Internal Server Error";
  const details = err.details || {};

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      request_id: (req as AuthenticatedRequest).requestId,
    },
  });
};

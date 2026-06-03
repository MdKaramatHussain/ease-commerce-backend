import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { loggerService } from "../services/logger.service";
import { LoginRequest, RefreshTokenRequest, SignupRequest } from "../types";
import { validate, loginValidationSchema, refreshTokenValidationSchema, signupValidationSchema } from "../validators";
import { ValidationError } from "../utils/errors";

const router = Router();

interface AuthReq extends Request {
  requestId?: string;
}

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post("/signin", async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    loggerService.info("Signup request", { email: req.body.email, requestId: req.requestId, role: req.body.role });

    const { value, error } = validate(signupValidationSchema, req.body);

    if (error) {
      const details: Record<string, string> = {};
      error.details.forEach((detail) => {
        details[detail.path.join(".")] = detail.message;
      });
      throw new ValidationError("Validation failed", details);
    }

    const result = await authService.signup(value as SignupRequest);

    res.status(200).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post("/login", async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    loggerService.info("Login request", { email: req.body.email, requestId: req.requestId });

    const { value, error } = validate(loginValidationSchema, req.body);

    if (error) {
      const details: Record<string, string> = {};
      error.details.forEach((detail) => {
        details[detail.path.join(".")] = detail.message;
      });
      throw new ValidationError("Validation failed", details);
    }

    const result = await authService.login(value as LoginRequest);

    res.status(200).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/refresh-token
 * Refresh access token
 */
router.post("/refresh-token", async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    loggerService.info("Refresh token request", { requestId: req.requestId });

    const { value, error } = validate(refreshTokenValidationSchema, req.body);

    if (error) {
      const details: Record<string, string> = {};
      error.details.forEach((detail) => {
        details[detail.path.join(".")] = detail.message;
      });
      throw new ValidationError("Validation failed", details);
    }

    
    const result = await authService.refreshToken(value as RefreshTokenRequest);
    res.status(200).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

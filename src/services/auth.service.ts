import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories";
import { config } from "../config";
import { JwtPayload, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, SignupRequest, SignupResponse } from "../types";
import { loggerService } from "./logger.service";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async signup(request: SignupRequest): Promise<SignupResponse> {
    loggerService.info("Signup attempt", { email: request.email, role: request.role });

    const hashedPassword = await bcrypt.hash(request.password, 10);
    const user = await this.userRepository.create({
      email: request.email,
      password: hashedPassword,
      role: request.role,
    });

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    loggerService.info("Signup successful", { userId: user.id, email: user.email });

    return {
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as any,
      },
    };
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    loggerService.info("Login attempt", { email: request.email });

    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      loggerService.warn("Login failed - user not found", { email: request.email });
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(request.password, user.password);
    if (!isPasswordValid) {
      loggerService.warn("Login failed - invalid password", { email: request.email });
      throw new Error("Invalid credentials");
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    loggerService.info("Login successful", { userId: user.id, email: user.email });

    return {
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as any,
      },
    };
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const decoded = jwt.verify(request.refresh_token, config.jwt.refreshSecret) as JwtPayload;

      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new Error("User not found");
      }

      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role as any,
      };

      const newAccessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      loggerService.info("Token refreshed", { userId: user.id });

      return {
        success: true,
        access_token: newAccessToken,
      };
    } catch (error) {
      loggerService.error("Token refresh failed", error as Error);
      throw new Error("Invalid refresh token");
    }
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      loggerService.error("Token verification failed", error as Error);
      throw new Error("Invalid token");
    }
  }
}

export const authService = new AuthService();

import dotenv from "dotenv";
import { SignOptions } from "jsonwebtoken";


dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME || "ease-commerce",
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000"),
    apiVersion: process.env.API_VERSION || "v1",
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000/api",
  },

  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "root",
    password: "",
    name: process.env.DB_NAME || "ease_commerce",
    dialect: process.env.DB_DIALECT || "mysql",
    logging: process.env.NODE_ENV !== "production",
    pool: {
      max: 5,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret_key",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your_jwt_refresh_secret",
    expiresIn: (process.env.JWT_EXPIRY || "15m") as SignOptions["expiresIn"],
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRY || "7d") as SignOptions["expiresIn"]
  },

  courier: {
    maxRetries: parseInt(process.env.COURIER_MAX_RETRIES || "3"),
    retryDelay: parseInt(process.env.COURIER_RETRY_DELAY || "1000"),
    timeout: parseInt(process.env.COURIER_TIMEOUT || "30000"),
    urbanebolt: {
      apiUrl: process.env.URBANEBOLT_API_URL || "https://api.urbanebolt.com",
      apiKey: process.env.URBANEBOLT_API_KEY || "",
      clientId: process.env.URBANEBOLT_CLIENT_ID || "",
      clientSecret: process.env.URBANEBOLT_CLIENT_SECRET || "",
    },
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL || "3600"),
    authTokenTtl: parseInt(process.env.AUTH_TOKEN_CACHE_TTL || "1800"),
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "combined",
    dir: process.env.LOG_DIR || "./logs",
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },

  features: {
    mockCourierEnabled: process.env.MOCK_COURIER_ENABLED === "true",
  },
};

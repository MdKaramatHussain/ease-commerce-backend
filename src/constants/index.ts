export const SHIPMENT_STATUS = {
  CREATED: "CREATED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
} as const;

export const BATCH_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  PARTIAL_SUCCESS: "PARTIAL_SUCCESS",
} as const;

export const USER_ROLES = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
} as const;

export const COURIER_NAMES = {
  URBANEBOLT: "urbanebolt",
  DELHIVERY: "delhivery",
  SHIPROCKET: "shiprocket",
  BLUEDART: "bluedart",
  DTDC: "dtdc",
  MOCKCOURIER: "mockcourier",
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_COURIER: "UNKNOWN_COURIER",
  COURIER_TIMEOUT: "COURIER_TIMEOUT",
  COURIER_AUTH_FAILED: "COURIER_AUTH_FAILED",
  COURIER_API_ERROR: "COURIER_API_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_ORDER: "DUPLICATE_ORDER",
} as const;

export const API_VERSIONS = {
  V1: "v1",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const CACHE_KEYS = {
  COURIER_AUTH_TOKEN: (courier: string) => `courier:${courier}:auth_token`,
  ORDER_TRACKING: (awbNumber: string) => `order:tracking:${awbNumber}`,
  BATCH_STATUS: (batchId: string) => `batch:status:${batchId}`,
} as const;

export const VALIDATION_RULES = {
  ORDER_ID_MIN_LENGTH: 3,
  ORDER_ID_MAX_LENGTH: 50,
  PHONE_PATTERN: /^[0-9]{10}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PINCODE_PATTERN: /^[0-9]{6}$/,
  MAX_BULK_ORDERS: 100,
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: parseInt(process.env.COURIER_MAX_RETRIES || "3"),
  RETRY_DELAY: parseInt(process.env.COURIER_RETRY_DELAY || "1000"),
  TIMEOUT: parseInt(process.env.COURIER_TIMEOUT || "30000"),
} as const;

export const CACHE_TTL = {
  AUTH_TOKEN: parseInt(process.env.AUTH_TOKEN_CACHE_TTL || "1800"), // 30 minutes
  TRACKING_DATA: parseInt(process.env.CACHE_TTL || "3600"), // 1 hour
  BATCH_STATUS: parseInt(process.env.CACHE_TTL || "3600"), // 1 hour
} as const;

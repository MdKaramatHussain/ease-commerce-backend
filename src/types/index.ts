// Courier Provider Interface - Strategy Pattern
export interface CourierProvider {
  authenticate(): Promise<void>;
  
  createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse>;
  
  trackShipment(awbNumber: string): Promise<TrackingResponse>;
  
  cancelShipment(shipmentId: string): Promise<CancelShipmentResponse>;
}

// DTOs
export interface CreateShipmentDto {
  order_id: string;
  courier_partner: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items?: {
    description: string;
    quantity: number;
    weight?: number;
    value?: number;
  }[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  special_instructions?: string;
}

export interface CreateShipmentResponse {
  success: boolean;
  courier_order_id: string;
  awb_number: string;
  order_id: string;
  estimated_delivery?: string;
  status: string;
}

export interface TrackingResponse {
  awb_number: string;
  order_id: string;
  status: string;
  current_location?: string;
  last_update?: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description?: string;
}

export interface CancelShipmentResponse {
  success: boolean;
  shipment_id: string;
  message: string;
}

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface SignupResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  access_token: string;
}

// Order DTOs
export interface CreateOrderRequest {
  order_id: string;
  courier_partner: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items?: {
    description: string;
    quantity: number;
    weight?: number;
    value?: number;
  }[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  special_instructions?: string;
}

export interface BulkCreateOrderRequest {
  orders: CreateOrderRequest[];
}

export interface OrderResponse {
  id: string;
  order_id: string;
  courier_partner: string;
  courier_order_id?: string;
  awb_number?: string;
  status: ShipmentStatus;
  created_at: Date;
  updated_at: Date;
}

// Batch DTOs
export interface CreateBatchResponse {
  success: boolean;
  batch_id: string;
  total_orders: number;
  status: BatchStatus;
  created_at: Date;
}

export interface BatchStatusResponse {
  batch_id: string;
  status: BatchStatus;
  total_orders: number;
  success_count: number;
  failed_count: number;
  created_at: Date;
  updated_at: Date;
}

// Error Response
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp?: Date;
    request_id?: string;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp?: Date;
  request_id?: string;
}

// Enums
export enum ShipmentStatus {
  CREATED = "CREATED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export enum BatchStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PARTIAL_SUCCESS = "PARTIAL_SUCCESS",
}

export enum UserRole {
  ADMIN = "ADMIN",
  OPERATOR = "OPERATOR",
}

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN_COURIER = "UNKNOWN_COURIER",
  COURIER_TIMEOUT = "COURIER_TIMEOUT",
  COURIER_AUTH_FAILED = "COURIER_AUTH_FAILED",
  COURIER_API_ERROR = "COURIER_API_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE_ORDER = "DUPLICATE_ORDER",
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Courier Config
export interface CourierConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

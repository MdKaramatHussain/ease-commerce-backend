# 🏗️ Delivery Partner Architecture - Technical Reference

Quick visual guide for understanding and extending the courier integration system.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Endpoints                             │
│  POST /orders  │  GET /tracking  │  POST /orders/bulk            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Business Logic (Services)                       │
│  OrderService │ BatchService │ TrackingService │ AuthService     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CourierFactory                               │
│  - Selects appropriate courier adapter                            │
│  - Manages adapter registration                                   │
│  - Returns CourierProvider implementation                         │
└────────────────────────┬────────────────────────────────────────┘
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │UrbaneBolt│   │Delhivery │   │Shiprocket│   │BlueDart  │
    │Adapter  │    │Adapter   │   │Adapter   │    │Adapter   │
    └────┬────┘    └────┬─────┘   └────┬─────┘    └────┬─────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌─────────┐
    │ Cache  │   │ Logging  │   │ Error   │
    │Service │   │Service   │   │Handling │
    └────────┘   └──────────┘   └─────────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │  Courier APIs        │
            │  (Real Requests)     │
            └──────────────────────┘
```

---

## 🔄 Request Flow: Creating a Shipment

```
1. Client Request
   ├─ POST /api/v1/orders
   ├─ Body: { order_id, courier_partner, customer, address, ... }
   └─ Headers: { Authorization: Bearer <token> }

   ▼

2. API Controller
   ├─ Validate request (Joi schema)
   ├─ Check authentication
   └─ Extract courier name: "delhivery"

   ▼

3. Order Service
   ├─ Check for duplicate orders (idempotency)
   ├─ Save order to database
   └─ Call: CourierFactory.getCourier("delhivery")

   ▼

4. Courier Factory
   ├─ Normalize name to lowercase
   ├─ Check if adapter registered
   └─ Return: new DelhiveryAdapter()

   ▼

5. Delhivery Adapter (Implements CourierProvider)
   ├─ authenticate()
   │  ├─ Check cache for auth token
   │  ├─ If expired: fetch new token from Delhivery API
   │  └─ Store in cache (30 min TTL)
   │
   ├─ createShipment(payload)
   │  ├─ Transform payload to Delhivery format
   │  ├─ Make HTTP POST to Delhivery API
   │  │  (Automatically retried 3x with exponential backoff)
   │  └─ Transform response back to standard format
   │
   └─ Return CreateShipmentResponse
      ├─ success: true
      ├─ courier_order_id: "DHV_123456"
      ├─ awb_number: "DHV789012"
      ├─ estimated_delivery: "2024-06-15"
      └─ status: "CREATED"

   ▼

6. Order Service (continued)
   ├─ Update order in database with AWB number
   ├─ Store courier response
   └─ Log operation

   ▼

7. Client Response
   └─ 201 Created
      {
        "order_id": "ORD123",
        "courier_partner": "delhivery",
        "awb_number": "DHV789012",
        "status": "CREATED",
        ...
      }
```

---

## 🏗️ Adapter Structure

Every courier adapter follows this structure:

```
DelhiveryAdapter
│
├─ Constructor
│  └─ Initialize config from environment variables
│
├─ authenticate(): Promise<void>
│  ├─ Check cache for token
│  ├─ If cached: use cached token
│  └─ Else: fetch from API, cache result
│
├─ createShipment(payload): Promise<CreateShipmentResponse>
│  ├─ Authenticate (if needed)
│  ├─ Transform payload (order format → courier format)
│  ├─ Make API request (HTTP POST)
│  ├─ Transform response (courier format → standard format)
│  └─ Return standardized response
│
├─ trackShipment(awbNumber): Promise<TrackingResponse>
│  ├─ Authenticate (if needed)
│  ├─ Make API request (HTTP GET)
│  ├─ Transform response
│  └─ Return tracking details
│
├─ cancelShipment(shipmentId): Promise<CancelShipmentResponse>
│  ├─ Authenticate (if needed)
│  ├─ Make API request (HTTP POST)
│  └─ Return cancellation confirmation
│
└─ Helper Methods (private)
   ├─ transformCreateShipmentPayload()
   ├─ transformTrackingResponse()
   └─ validatePayload()
```

---

## 🔑 Key Interfaces

### CourierProvider Interface
```typescript
interface CourierProvider {
  authenticate(): Promise<void>;
  
  createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse>;
  
  trackShipment(awbNumber: string): Promise<TrackingResponse>;
  
  cancelShipment(shipmentId: string): Promise<CancelShipmentResponse>;
}
```

### DTOs (Data Transfer Objects)

```typescript
interface CreateShipmentDto {
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
  items?: Array<{
    description: string;
    quantity: number;
    weight?: number;
    value?: number;
  }>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  special_instructions?: string;
}

interface CreateShipmentResponse {
  success: boolean;
  courier_order_id: string;      // Courier's reference ID
  awb_number: string;            // Tracking number
  order_id: string;              // Your order ID
  estimated_delivery?: string;   // ISO date string
  status: string;                // CREATED, IN_TRANSIT, etc.
}

interface TrackingResponse {
  awb_number: string;
  order_id: string;
  status: string;
  current_location?: string;
  last_update?: string;
  events: Array<{
    status: string;
    location: string;
    timestamp: string;
    description?: string;
  }>;
}

interface CancelShipmentResponse {
  success: boolean;
  shipment_id: string;
  message: string;
}
```

---

## 🔗 Class Hierarchy

```
BaseCourierClient (Abstract base)
│
├─ Provides HTTP client
├─ Handles retries
├─ Manages errors
├─ Supports authentication
└─ Transforms headers

   │
   └─ Extends ▼

   DelhiveryAdapter
   │
   ├─ Implements CourierProvider
   ├─ Specific Delhivery logic
   ├─ API transformations
   └─ Authentication method

   UrbaneboltAdapter
   │
   ├─ Implements CourierProvider
   ├─ Specific UrbaneBolt logic
   ├─ API transformations
   └─ OAuth authentication

   MockCourierAdapter
   │
   ├─ Implements CourierProvider
   ├─ Simulates courier behavior
   └─ In-memory storage
```

---

## 🗂️ File Structure for New Courier

```
src/
├─ adapters/
│  └─ delhivery/
│     ├─ delhivery.adapter.ts          ← Main adapter implementation
│     ├─ delhivery.transformer.ts      ← Optional: if transformations are complex
│     ├─ delhivery.types.ts            ← Optional: if custom types needed
│     └─ index.ts                      ← Export adapter
│
├─ config/
│  └─ index.ts                         ← Add config section for new courier
│
├─ constants/
│  └─ index.ts                         ← Add COURIER_NAMES constant
│
├─ factories/
│  └─ CourierFactory.ts                ← Register adapter
│
└─ types/
   └─ index.ts                         ← Courier interface (already exists)

tests/
├─ unit/
│  ├─ delhivery.test.ts               ← Unit tests
│  └─ courier-factory.test.ts         ← Integration test (update)
│
└─ integration/
   └─ api.test.ts                      ← End-to-end test (update)
```

---

## 🔄 Data Flow: Key Transformations

### Inbound Transformation (Order → Courier API)

```
Standard Order Format (System)
{
  order_id: "ORD123",
  customer: { name: "John", phone: "9999999999" },
  address: { city: "Mumbai", state: "Maharashtra", ... }
}

    │ Transform by Adapter
    ▼

Delhivery Format (Courier API)
{
  order_id: "ORD123",
  customer_name: "John",
  customer_phone: "9999999999",
  delivery_city: "Mumbai",
  delivery_state: "MH",  // ← Note: Delhivery wants state codes
  ...
}

    │ HTTP POST to Delhivery
    ▼

Delhivery Response
{
  shipment_id: "DHV_2024_001",
  waybill_number: "DHV789012",
  status: "created",
  estimated_delivery_date: "2024-06-15"
}
```

### Outbound Transformation (Courier Response → System)

```
Delhivery Response
{
  shipment_id: "DHV_2024_001",
  waybill_number: "DHV789012",
  status: "created",
  ...
}

    │ Transform by Adapter
    ▼

Standard Response Format
{
  success: true,
  courier_order_id: "DHV_2024_001",
  awb_number: "DHV789012",
  status: "CREATED",
  ...
}

    │ API Response
    ▼

Client
{
  "order_id": "ORD123",
  "courier_partner": "delhivery",
  "awb_number": "DHV789012",
  "status": "CREATED",
  ...
}
```

---

## 🔐 Authentication Patterns

### Pattern 1: API Key (Simple)
```typescript
// Configuration
DELHIVERY_API_KEY=your_api_key

// Adapter
constructor() {
  this.apiKey = config.courier.delhivery.apiKey;
}

// Usage
headers: { "X-API-Key": this.apiKey }
```

### Pattern 2: OAuth Token (With Cache)
```typescript
// Configuration
DELHIVERY_CLIENT_ID=...
DELHIVERY_CLIENT_SECRET=...

// Adapter
async authenticate(): Promise<void> {
  // Check cache
  const cached = cacheService.get(cacheKey);
  if (cached) return this.authToken = cached;
  
  // Fetch token
  const response = await this.request("post", tokenUrl, credentials);
  this.authToken = response.access_token;
  
  // Cache for 30 minutes
  cacheService.set(cacheKey, this.authToken, 1800);
}
```

### Pattern 3: Session Based
```typescript
// Configuration
DELHIVERY_USERNAME=...
DELHIVERY_PASSWORD=...

// Adapter
async authenticate(): Promise<void> {
  const response = await this.request("post", loginUrl, {
    username: config.courier.delhivery.username,
    password: config.courier.delhivery.password,
  });
  
  this.authToken = response.session_id;
  this.cookies = response.cookies;
}
```

---

## 🛠️ Error Handling Chain

```
HTTP Error from Courier API
│
├─ Network Error (timeout, connection refused)
│  └─ Retry 3x with exponential backoff
│  └─ Throw CourierTimeoutError
│
├─ Auth Error (401, 403)
│  └─ Clear cache
│  └─ Try re-authenticate
│  └─ Throw CourierAuthError
│
├─ API Error (400, 422)
│  └─ Log details
│  └─ Throw CourierApiError with original response
│
├─ Server Error (500, 502, 503)
│  └─ Retry up to 3 times
│  └─ Throw CourierApiError after retries exhausted
│
└─ Unknown Error
   └─ Log stack trace
   └─ Throw CourierApiError with generic message
```

---

## 💾 Caching Strategy

```
Operation            │  Cache Key                │  TTL      │  Invalidated
─────────────────────┼──────────────────────────┼───────────┼──────────────
Auth Token           │ courier_{name}_auth_token│ 30 min    │ On error
Tracking Data        │ tracking_{awb_number}    │ 1 hour    │ Manual
Shipment Status      │ shipment_{shipment_id}   │ 15 min    │ On update
Supported Couriers   │ couriers_list            │ 24 hours  │ Manual
```

**Cache Cleanup**: Automatic every 1 minute (see `CacheService`)

---

## 📝 Configuration Example

### config/index.ts
```typescript
export const config = {
  courier: {
    // Global settings
    maxRetries: 3,              // Retry failed requests
    retryDelay: 1000,           // Initial retry delay in ms
    timeout: 30000,             // Request timeout in ms
    
    // Delhivery config
    delhivery: {
      apiUrl: "https://api.delhivery.com",
      apiKey: process.env.DELHIVERY_API_KEY,
      warehouseId: process.env.DELHIVERY_WAREHOUSE_ID,
      defaultPickupLocation: "Mumbai",
    },
    
    // Shiprocket config
    shiprocket: {
      apiUrl: "https://apiv2.shiprocket.in",
      apiKey: process.env.SHIPROCKET_API_KEY,
      channelId: process.env.SHIPROCKET_CHANNEL_ID,
    },
  },
};
```

### .env
```bash
# Global
COURIER_MAX_RETRIES=3
COURIER_RETRY_DELAY=1000
COURIER_TIMEOUT=30000

# Delhivery
DELHIVERY_API_URL=https://api.delhivery.com
DELHIVERY_API_KEY=your_api_key_here
DELHIVERY_WAREHOUSE_ID=warehouse_123

# Shiprocket
SHIPROCKET_API_URL=https://apiv2.shiprocket.in
SHIPROCKET_API_KEY=your_api_key_here
SHIPROCKET_CHANNEL_ID=123456
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe("Delhivery Adapter", () => {
  it("should authenticate", async () => { /* ... */ });
  it("should create shipment", async () => { /* ... */ });
  it("should track shipment", async () => { /* ... */ });
  it("should cancel shipment", async () => { /* ... */ });
});
```

### Integration Tests
```typescript
describe("Order Service with Delhivery", () => {
  it("should create order with Delhivery", async () => {
    const order = await orderService.createOrder({
      courier_partner: "delhivery",
      // ... order details
    });
    
    expect(order.courier_partner).toBe("delhivery");
    expect(order.awb_number).toBeDefined();
  });
});
```

### End-to-End Tests
```bash
# 1. Login
curl POST /api/v1/auth/login

# 2. Create order with new courier
curl POST /api/v1/orders -H "Authorization: Bearer <token>"

# 3. Track shipment
curl GET /api/v1/orders/track/<awb>

# 4. Check logs
tail -f logs/combined.log
```

---

## 🚀 Deployment Checklist

- [ ] Add new courier constant to `COURIER_NAMES`
- [ ] Update `config/index.ts` with new courier config
- [ ] Create adapter file implementing `CourierProvider`
- [ ] Register adapter in `CourierFactory`
- [ ] Add environment variable handling in `.env` and `.env.example`
- [ ] Write unit tests in `tests/unit/`
- [ ] Test API endpoints with new courier
- [ ] Update API documentation
- [ ] Test in staging environment
- [ ] Get real API credentials
- [ ] Deploy to production
- [ ] Monitor logs for errors

---

## 📚 Design Patterns Used

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Factory Pattern** | `CourierFactory` | Decouple adapter creation from usage |
| **Strategy Pattern** | `CourierProvider` interface | Enable runtime algorithm switching |
| **Template Method** | `BaseCourierClient` | Common HTTP logic, specific implementation in adapters |
| **Adapter Pattern** | Each courier adapter | Adapt external API to internal interface |
| **Decorator Pattern** | Error handling interceptors | Add functionality to requests transparently |
| **Singleton Pattern** | Services (cache, logger) | Global state management |

---

## 💡 Tips & Tricks

1. **Use MockCourier for Testing**
   ```typescript
   const courier = new MockCourierAdapter();
   await courier.createShipment(payload); // Always succeeds
   ```

2. **Cache OAuth Tokens**
   - Don't fetch token on every request
   - Use `CacheService` with 30-minute TTL
   - Clear cache on auth errors

3. **Handle Rate Limiting**
   - Implement exponential backoff (already in BaseCourierClient)
   - Log retry attempts
   - Monitor retry rates

4. **Transform Early**
   - Transform input immediately after authentication
   - Reduces chance of API mismatches
   - Makes debugging easier

5. **Test Failure Scenarios**
   - Timeout: Test with very short timeout
   - Auth Error: Test with invalid credentials
   - API Error: Mock error responses

---

**Last Updated**: 2024-06-09  
**Maintainer**: Development Team

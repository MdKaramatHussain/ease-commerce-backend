# 📦 Adding New Delivery Partners - Complete Guide

This guide explains how to add new delivery partners (couriers) to your Ease Commerce platform using the existing extensible architecture.

## 🏗️ Architecture Overview

The system uses the **Factory Pattern** combined with the **Strategy Pattern** to manage multiple courier integrations:

```
Request → OrderService → CourierFactory → Adapter (UrbaneBolt, Delhivery, etc.)
                                              ↓
                                         API Call
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **CourierProvider Interface** | `src/types/index.ts` | Contract all couriers must implement |
| **CourierFactory** | `src/factories/CourierFactory.ts` | Registers and returns courier adapters |
| **BaseCourierClient** | `src/utils/courier-client.ts` | Base class for HTTP requests & error handling |
| **Adapters** | `src/adapters/{courier_name}/` | Courier-specific implementations |
| **Constants** | `src/constants/index.ts` | Courier name constants |
| **Config** | `src/config/index.ts` | Courier credentials & settings |

---

## 📋 Step-by-Step Guide

### **Step 1: Add Courier Name to Constants**

Edit `src/constants/index.ts`:

```typescript
export const COURIER_NAMES = {
  URBANEBOLT: "urbanebolt",
  MOCKCOURIER: "mockcourier",
  DELHIVERY: "delhivery",           // ← Add your courier here
  SHIPROCKET: "shiprocket",         // ← Add your courier here
  BLUEDART: "bluedart",             // ← Add your courier here
  DTDC: "dtdc",                     // ← Add your courier here
} as const;
```

### **Step 2: Add Courier Configuration**

Edit `src/config/index.ts` and add configuration for your courier:

```typescript
export const config = {
  // ... existing config ...
  
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
    
    // Add your courier config
    delhivery: {
      apiUrl: process.env.DELHIVERY_API_URL || "https://api.delhivery.com",
      apiKey: process.env.DELHIVERY_API_KEY || "",
      // Add other required credentials
    },
  },
};
```

### **Step 3: Create Courier Adapter**

Create a new folder for your courier: `src/adapters/{courier_name}/`

#### File: `src/adapters/delhivery/delhivery.adapter.ts`

```typescript
import { 
  CourierProvider, 
  CreateShipmentDto, 
  CreateShipmentResponse, 
  TrackingResponse, 
  CancelShipmentResponse 
} from "../../types";
import { BaseCourierClient } from "../../utils/courier-client";
import { config } from "../../config";
import { cacheService } from "../../cache/cache.service";
import { CACHE_KEYS, CACHE_TTL } from "../../constants";
import { loggerService } from "../../services/logger.service";
import { CourierAuthError } from "../../utils/errors";

/**
 * Delhivery Courier Adapter
 * Implements CourierProvider interface for Delhivery API
 */
export class DelhiveryAdapter extends BaseCourierClient implements CourierProvider {
  private apiKey: string;

  constructor() {
    super("Delhivery");
    this.apiKey = config.courier.delhivery.apiKey;
  }

  /**
   * Authenticate with Delhivery API
   * Delhivery uses API key authentication - store it for subsequent requests
   */
  async authenticate(): Promise<void> {
    const cacheKey = CACHE_KEYS.COURIER_AUTH_TOKEN("delhivery");
    
    // Check cache first
    const cachedAuth = cacheService.get<string>(cacheKey);
    if (cachedAuth) {
      this.authToken = cachedAuth;
      loggerService.debug("Using cached Delhivery auth token");
      return;
    }

    try {
      // Validate API key exists
      if (!this.apiKey) {
        throw new Error("Delhivery API key not configured");
      }

      // Delhivery uses direct API key - store it as auth token
      this.authToken = this.apiKey;
      cacheService.set(cacheKey, this.apiKey, CACHE_TTL.AUTH_TOKEN);
      loggerService.info("Delhivery authentication successful");
    } catch (error) {
      loggerService.error("Delhivery authentication failed", error as Error);
      throw new CourierAuthError("Failed to authenticate with Delhivery");
    }
  }

  /**
   * Create a shipment with Delhivery
   * Returns shipment details including AWB number
   */
  async createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse> {
    await this.authenticate();

    const requestBody = this.transformCreateShipmentPayload(payload);

    const response = await this.request<{
      shipment_id: string;
      waybill_number: string;
      status: string;
      estimated_delivery_date: string;
    }>(
      "post",
      `${config.courier.delhivery.apiUrl}/shipments/create`,
      requestBody,
      {
        "X-API-Key": this.authToken || "",
      }
    );

    loggerService.info("Delhivery shipment created", {
      orderId: payload.order_id,
      awb: response.waybill_number,
    });

    return {
      success: true,
      courier_order_id: response.shipment_id,
      awb_number: response.waybill_number,
      order_id: payload.order_id,
      estimated_delivery: response.estimated_delivery_date,
      status: response.status,
    };
  }

  /**
   * Track a shipment by AWB number
   */
  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    await this.authenticate();

    const response = await this.request<{
      waybill_number: string;
      status: string;
      current_location: string;
      last_status_update: string;
      track_events: any[];
    }>(
      "get",
      `${config.courier.delhivery.apiUrl}/shipments/${awbNumber}/track`,
      undefined,
      {
        "X-API-Key": this.authToken || "",
      }
    );

    return {
      awb_number: response.waybill_number,
      order_id: awbNumber,
      status: response.status,
      current_location: response.current_location,
      last_update: response.last_status_update,
      events: response.track_events.map((event: any) => ({
        status: event.status,
        location: event.location,
        timestamp: event.timestamp,
        description: event.description,
      })),
    };
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId: string): Promise<CancelShipmentResponse> {
    await this.authenticate();

    const response = await this.request<{
      shipment_id: string;
      message: string;
    }>(
      "post",
      `${config.courier.delhivery.apiUrl}/shipments/${shipmentId}/cancel`,
      {},
      {
        "X-API-Key": this.authToken || "",
      }
    );

    loggerService.info("Delhivery shipment cancelled", {
      shipmentId,
    });

    return {
      success: true,
      shipment_id: response.shipment_id,
      message: response.message,
    };
  }

  /**
   * Transform order payload to Delhivery API format
   */
  private transformCreateShipmentPayload(payload: CreateShipmentDto): Record<string, any> {
    return {
      order_id: payload.order_id,
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email || "noemail@example.com",
      },
      pickup_location: {
        // Default warehouse - in production, make this configurable
        name: "Warehouse",
        phone: "9999999999",
        address: "123 Main St",
        city: "Mumbai",
        state: "MH",
        pincode: "400001",
      },
      delivery_location: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        address: payload.address.line1,
        city: payload.address.city,
        state: payload.address.state,
        pincode: payload.address.pincode,
      },
      items: payload.items || [],
      weight: payload.weight || 0.5,
      dimensions: payload.dimensions,
    };
  }
}
```

### **Step 4: Register Adapter in Factory**

Edit `src/factories/CourierFactory.ts`:

```typescript
import { CourierProvider } from "../types";
import { UrbaneboltAdapter } from "../adapters/urbanebolt/urbanebolt.adapter";
import { MockCourierAdapter } from "../adapters/mockcourier/mockcourier.adapter";
import { DelhiveryAdapter } from "../adapters/delhivery/delhivery.adapter"; // ← Add import
import { UnknownCourierError } from "../utils/errors";
import { COURIER_NAMES } from "../constants";
import { loggerService } from "../services/logger.service";

/**
 * Courier Factory - Returns appropriate courier adapter based on name
 * Implements Factory Pattern
 */
export class CourierFactory {
  private static adapters = new Map<string, () => CourierProvider>([
    [
      COURIER_NAMES.URBANEBOLT,
      (): CourierProvider => new UrbaneboltAdapter(),
    ],
    [
      COURIER_NAMES.MOCKCOURIER,
      (): CourierProvider => new MockCourierAdapter(),
    ],
    // Add your new courier here
    [
      COURIER_NAMES.DELHIVERY,
      (): CourierProvider => new DelhiveryAdapter(),
    ],
  ]);

  static getCourier(courierName: string): CourierProvider {
    const normalizedName = courierName.toLowerCase();

    if (!this.adapters.has(normalizedName)) {
      loggerService.error("Unknown courier requested", new Error("Unknown courier"), {
        courier: normalizedName,
      });
      throw new UnknownCourierError(courierName);
    }

    const adapterFactory = this.adapters.get(normalizedName)!;
    const adapter = adapterFactory();

    loggerService.debug("Courier adapter created", { courier: normalizedName });
    return adapter;
  }

  static registerAdapter(
    courierName: string,
    adapterFactory: () => CourierProvider
  ): void {
    this.adapters.set(courierName.toLowerCase(), adapterFactory);
    loggerService.info("Courier adapter registered", { courier: courierName });
  }

  static getSupportedCouriers(): string[] {
    return Array.from(this.adapters.keys());
  }
}
```

### **Step 5: Add Environment Variables**

Update `.env` file:

```bash
# Delhivery Configuration
DELHIVERY_API_URL=https://api.delhivery.com
DELHIVERY_API_KEY=your_delhivery_api_key_here

# OR Shiprocket Configuration
SHIPROCKET_API_URL=https://api.shiprocket.in
SHIPROCKET_API_KEY=your_shiprocket_api_key_here
```

### **Step 6: Write Tests (Optional but Recommended)**

Create `tests/unit/delhivery.test.ts`:

```typescript
import { DelhiveryAdapter } from "../../src/adapters/delhivery/delhivery.adapter";
import { CreateShipmentDto } from "../../src/types";

describe("Delhivery Adapter", () => {
  let adapter: DelhiveryAdapter;

  beforeEach(() => {
    adapter = new DelhiveryAdapter();
  });

  it("should authenticate successfully", async () => {
    await expect(adapter.authenticate()).resolves.toBeUndefined();
  });

  it("should create shipment", async () => {
    await adapter.authenticate();

    const payload: CreateShipmentDto = {
      order_id: "ORD_DHV_001",
      courier_partner: "delhivery",
      customer: {
        name: "Raj Kumar",
        phone: "9876543210",
      },
      address: {
        line1: "456 Oak Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
    };

    const response = await adapter.createShipment(payload);

    expect(response.success).toBe(true);
    expect(response.courier_order_id).toBeDefined();
    expect(response.awb_number).toBeDefined();
    expect(response.order_id).toBe("ORD_DHV_001");
  });

  it("should track shipment", async () => {
    await adapter.authenticate();

    const response = await adapter.trackShipment("DHV123456");

    expect(response.awb_number).toBe("DHV123456");
    expect(response.status).toBeDefined();
    expect(response.events).toBeInstanceOf(Array);
  });

  it("should cancel shipment", async () => {
    await adapter.authenticate();

    const response = await adapter.cancelShipment("DHV_SHIP_123");

    expect(response.success).toBe(true);
    expect(response.shipment_id).toBeDefined();
  });
});
```

### **Step 7: Verify Integration**

Run tests to verify your implementation:

```bash
npm test
```

Test with API:

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin@123"}'

# 2. Create order with new courier
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD_DHV_001",
    "courier_partner": "delhivery",
    "customer": {"name": "John", "phone": "9999999999"},
    "address": {"line1": "123 St", "city": "Delhi", "state": "Delhi", "pincode": "110001"}
  }'

# 3. Track shipment
curl http://localhost:3000/api/v1/orders/track/AWABNUMBER
```

---

## 📚 Courier Interface Contract

All courier adapters must implement this interface:

```typescript
export interface CourierProvider {
  /**
   * Authenticate with courier API
   * Called before each operation
   */
  authenticate(): Promise<void>;

  /**
   * Create a shipment
   * @param payload Order and delivery details
   * @returns Shipment confirmation with AWB number
   */
  createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse>;

  /**
   * Track shipment by AWB number
   * @param awbNumber Tracking number
   * @returns Current shipment status and tracking history
   */
  trackShipment(awbNumber: string): Promise<TrackingResponse>;

  /**
   * Cancel a shipment
   * @param shipmentId Courier's shipment ID
   * @returns Cancellation confirmation
   */
  cancelShipment(shipmentId: string): Promise<CancelShipmentResponse>;
}
```

---

## 🔌 Common Integration Patterns

### **API Key Authentication**

```typescript
async authenticate(): Promise<void> {
  this.authToken = config.courier.mypartner.apiKey;
}

// Use in requests
protected getHeaders(): Record<string, string> {
  return {
    "X-API-Key": this.authToken,
    "Content-Type": "application/json",
  };
}
```

### **OAuth/Token-Based Authentication**

```typescript
async authenticate(): Promise<void> {
  const cacheKey = CACHE_KEYS.COURIER_AUTH_TOKEN("mypartner");
  const cached = cacheService.get<string>(cacheKey);
  
  if (cached) {
    this.authToken = cached;
    return;
  }

  const response = await this.request<{ access_token: string }>(
    "post",
    `${config.courier.mypartner.apiUrl}/oauth/token`,
    {
      client_id: config.courier.mypartner.clientId,
      client_secret: config.courier.mypartner.clientSecret,
    }
  );

  this.authToken = response.access_token;
  cacheService.set(cacheKey, response.access_token, CACHE_TTL.AUTH_TOKEN);
}
```

### **Request Transformation**

Map your courier's required format:

```typescript
private transformCreateShipmentPayload(payload: CreateShipmentDto): Record<string, any> {
  return {
    // Your courier's field names
    reference_id: payload.order_id,
    shipper: { /* ... */ },
    consignee: { /* ... */ },
    // etc.
  };
}
```

### **Response Transformation**

Map responses back to standard format:

```typescript
async createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse> {
  const response = await this.request<YourCourierResponse>(/*...*/);
  
  return {
    success: true,
    courier_order_id: response.shipment_id,      // Your field → standard
    awb_number: response.tracking_number,         // Your field → standard
    order_id: payload.order_id,
    estimated_delivery: response.delivery_date,
    status: response.shipment_status,
  };
}
```

---

## 🛠️ Helpful Utilities

### **Error Handling**

Use predefined error classes:

```typescript
import { 
  CourierAuthError, 
  CourierApiError, 
  CourierTimeoutError 
} from "../utils/errors";

try {
  // API call
} catch (error) {
  throw new CourierApiError("Delhivery", "Failed to create shipment", 500);
}
```

### **Retry Logic**

Automatically handled by `BaseCourierClient.request()`:

```typescript
// Automatically retries 3 times with exponential backoff
const response = await this.request<T>("post", url, data);
```

### **Caching**

Cache expensive operations:

```typescript
const cacheKey = CACHE_KEYS.COURIER_AUTH_TOKEN("delhivery");
const cached = cacheService.get<string>(cacheKey);

if (cached) return cached;

// ... fetch token ...

cacheService.set(cacheKey, token, CACHE_TTL.AUTH_TOKEN);
```

### **Logging**

Built-in structured logging:

```typescript
loggerService.info("Operation successful", { orderId, awb });
loggerService.error("Operation failed", error, { courier: "delhivery" });
loggerService.debug("Debug info", { /* data */ });
```

---

## 🚀 Quick Reference: Adding Delhivery in 5 Minutes

1. **Add constant**: `DELHIVERY: "delhivery"` in `constants/index.ts`
2. **Add config**: `delhivery: { apiUrl: ..., apiKey: ... }` in `config/index.ts`
3. **Create adapter**: `src/adapters/delhivery/delhivery.adapter.ts` (copy from UrbaneBolt as template)
4. **Register**: Add to `CourierFactory` adapters map
5. **Add `.env`**: `DELHIVERY_API_KEY=your_key`

**Done!** ✅

---

## ❓ FAQ

**Q: Do I need to modify route files?**
A: No. Routes automatically work with any registered courier via `CourierFactory.getCourier()`.

**Q: Can I have multiple instances of the same courier?**
A: Yes. Use `CourierFactory.registerAdapter()` to add variants:
```typescript
CourierFactory.registerAdapter("delhivery_premium", () => new DelhiveryAdapter());
```

**Q: How do I switch the default courier?**
A: Update order creation logic or add UI selection. The factory is agnostic.

**Q: What if my courier has different field names?**
A: Transform in adapter methods. See `transformCreateShipmentPayload()` example.

**Q: How do I test without real API credentials?**
A: Extend `MockCourierAdapter` for your courier or mock the HTTP responses.

---

## 📚 Reference Files

- **Interface Definition**: [src/types/index.ts](src/types/index.ts#L1-L10)
- **Factory Implementation**: [src/factories/CourierFactory.ts](src/factories/CourierFactory.ts)
- **UrbaneBolt Example**: [src/adapters/urbanebolt/urbanebolt.adapter.ts](src/adapters/urbanebolt/urbanebolt.adapter.ts)
- **MockCourier Example**: [src/adapters/mockcourier/mockcourier.adapter.ts](src/adapters/mockcourier/mockcourier.adapter.ts)
- **Base Client**: [src/utils/courier-client.ts](src/utils/courier-client.ts)
- **Test Example**: [tests/unit/courier-factory.test.ts](tests/unit/courier-factory.test.ts)

---

## ✅ Integration Checklist

- [ ] Added courier name to `COURIER_NAMES` constant
- [ ] Added configuration section in `config/index.ts`
- [ ] Created adapter file implementing `CourierProvider`
- [ ] Registered adapter in `CourierFactory`
- [ ] Added environment variables to `.env`
- [ ] Created unit tests
- [ ] Tested with API endpoints
- [ ] Verified logging works
- [ ] Updated API documentation
- [ ] Deployed to staging

---

**Happy integrating!** 🎉

# ⚡ Add New Courier - Quick Checklist

## TL;DR - 5 Step Process

1. **Add Constant** → `src/constants/index.ts`
2. **Add Config** → `src/config/index.ts`
3. **Create Adapter** → `src/adapters/{courier}/adapter.ts`
4. **Register Adapter** → `src/factories/CourierFactory.ts`
5. **Add Environment Variables** → `.env`

---

## Step 1️⃣: Add Courier Constant

**File**: `src/constants/index.ts`

```typescript
export const COURIER_NAMES = {
  URBANEBOLT: "urbanebolt",
  MOCKCOURIER: "mockcourier",
  DELHIVERY: "delhivery",        // ← ADD THIS
  SHIPROCKET: "shiprocket",      // ← ADD THIS
  BLUEDART: "bluedart",          // ← ADD THIS
} as const;
```

**What it does**: Defines valid courier names used throughout the system.

---

## Step 2️⃣: Add Configuration

**File**: `src/config/index.ts`

Find the `courier:` section and add your courier:

```typescript
export const config = {
  // ... other config ...
  
  courier: {
    maxRetries: parseInt(process.env.COURIER_MAX_RETRIES || "3"),
    retryDelay: parseInt(process.env.COURIER_RETRY_DELAY || "1000"),
    timeout: parseInt(process.env.COURIER_TIMEOUT || "30000"),
    
    urbanebolt: {
      // existing config
    },
    
    // ADD YOUR COURIER CONFIG HERE
    delhivery: {
      apiUrl: process.env.DELHIVERY_API_URL || "https://api.delhivery.com",
      apiKey: process.env.DELHIVERY_API_KEY || "",
      // Add any other fields your courier needs
    },
  },
};
```

**What it does**: Stores API credentials and configuration for your courier.

---

## Step 3️⃣: Create Adapter

**File**: `src/adapters/delhivery/delhivery.adapter.ts`

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
import { loggerService } from "../../services/logger.service";
import { CourierAuthError } from "../../utils/errors";

export class DelhiveryAdapter extends BaseCourierClient implements CourierProvider {
  private apiKey: string;

  constructor() {
    super("Delhivery");
    this.apiKey = config.courier.delhivery.apiKey;
  }

  async authenticate(): Promise<void> {
    try {
      if (!this.apiKey) {
        throw new Error("Delhivery API key not configured");
      }
      this.authToken = this.apiKey;
      loggerService.info("Delhivery authenticated");
    } catch (error) {
      loggerService.error("Delhivery authentication failed", error as Error);
      throw new CourierAuthError("Failed to authenticate with Delhivery");
    }
  }

  async createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse> {
    await this.authenticate();

    const response = await this.request<{
      shipment_id: string;
      waybill_number: string;
      status: string;
      estimated_delivery_date: string;
    }>(
      "post",
      `${config.courier.delhivery.apiUrl}/shipments/create`,
      this.transformPayload(payload),
      { "X-API-Key": this.authToken || "" }
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
      { "X-API-Key": this.authToken || "" }
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

  async cancelShipment(shipmentId: string): Promise<CancelShipmentResponse> {
    await this.authenticate();

    const response = await this.request<{
      shipment_id: string;
      message: string;
    }>(
      "post",
      `${config.courier.delhivery.apiUrl}/shipments/${shipmentId}/cancel`,
      {},
      { "X-API-Key": this.authToken || "" }
    );

    loggerService.info("Delhivery shipment cancelled", { shipmentId });

    return {
      success: true,
      shipment_id: response.shipment_id,
      message: response.message,
    };
  }

  private transformPayload(payload: CreateShipmentDto): Record<string, any> {
    return {
      order_id: payload.order_id,
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email || "noemail@example.com",
      },
      pickup_location: {
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

**What it does**: Implements the courier-specific logic for API calls.

---

## Step 4️⃣: Register in Factory

**File**: `src/factories/CourierFactory.ts`

Add import at the top:
```typescript
import { DelhiveryAdapter } from "../adapters/delhivery/delhivery.adapter";
```

Update the adapters map:
```typescript
private static adapters = new Map<string, () => CourierProvider>([
  [COURIER_NAMES.URBANEBOLT, (): CourierProvider => new UrbaneboltAdapter()],
  [COURIER_NAMES.MOCKCOURIER, (): CourierProvider => new MockCourierAdapter()],
  
  // ADD THIS LINE
  [COURIER_NAMES.DELHIVERY, (): CourierProvider => new DelhiveryAdapter()],
]);
```

**What it does**: Registers your adapter so the factory can create instances.

---

## Step 5️⃣: Add Environment Variables

**File**: `.env`

```bash
# Delhivery Configuration
DELHIVERY_API_URL=https://api.delhivery.com
DELHIVERY_API_KEY=your_api_key_here

# Example: Shiprocket
SHIPROCKET_API_URL=https://apiv2.shiprocket.in
SHIPROCKET_API_KEY=your_api_key_here

# Example: BlueDart
BLUEDART_API_URL=https://api.bluedart.com
BLUEDART_API_KEY=your_api_key_here
```

**What it does**: Provides runtime configuration without exposing secrets in code.

---

## ✅ Verification

### 1. Check TypeScript compiles
```bash
npm run build
```

### 2. Run tests
```bash
npm test
```

### 3. Test API endpoint

**Login first:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin@123"
  }'
```

**Create order with new courier:**
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST_DHV_001",
    "courier_partner": "delhivery",
    "customer": {
      "name": "John Doe",
      "phone": "9999999999"
    },
    "address": {
      "line1": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001"
    }
  }'
```

**Expected response (201 Created):**
```json
{
  "success": true,
  "order_id": "TEST_DHV_001",
  "courier_partner": "delhivery",
  "awb_number": "DHV789012",
  "status": "CREATED",
  "created_at": "2024-06-09T10:00:00Z"
}
```

### 4. Check logs
```bash
tail -f logs/combined.log
# Should see: "Delhivery shipment created"
```

---

## 🔍 Testing Your Implementation

### Unit Test Template

Create `tests/unit/delhivery.test.ts`:

```typescript
import { DelhiveryAdapter } from "../../src/adapters/delhivery/delhivery.adapter";
import { CreateShipmentDto } from "../../src/types";

describe("Delhivery Adapter", () => {
  let adapter: DelhiveryAdapter;

  beforeEach(() => {
    adapter = new DelhiveryAdapter();
  });

  it("should authenticate", async () => {
    await expect(adapter.authenticate()).resolves.toBeUndefined();
  });

  it("should create shipment", async () => {
    await adapter.authenticate();
    
    const payload: CreateShipmentDto = {
      order_id: "TEST_001",
      courier_partner: "delhivery",
      customer: { name: "John", phone: "9999999999" },
      address: {
        line1: "123 St",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
    };

    const response = await adapter.createShipment(payload);

    expect(response.success).toBe(true);
    expect(response.courier_order_id).toBeDefined();
    expect(response.awb_number).toBeDefined();
  });
});
```

Run test:
```bash
npm test -- delhivery.test.ts
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "Unknown courier" error | Add constant to `COURIER_NAMES` |
| "Config not found" | Add config section with `process.env.VARIABLE_NAME` |
| 401/403 errors | Check API key in `.env` |
| Timeout errors | Increase `COURIER_TIMEOUT` in config |
| Adapter not created | Check import and registration in `CourierFactory` |
| Type errors | Ensure adapter implements `CourierProvider` interface |

---

## 📚 Reference Files

| What | Where | How to Find |
|------|-------|------------|
| Courier interface | `src/types/index.ts` | Search `interface CourierProvider` |
| Factory | `src/factories/CourierFactory.ts` | Already prepared |
| Base client | `src/utils/courier-client.ts` | For HTTP handling |
| UrbaneBolt example | `src/adapters/urbanebolt/urbanebolt.adapter.ts` | Copy & adapt |
| MockCourier example | `src/adapters/mockcourier/mockcourier.adapter.ts` | For testing |

---

## 🎯 Next Courier to Add?

Copy this checklist for each courier:

### Adding Shiprocket
- [ ] Add `SHIPROCKET: "shiprocket"` to constants
- [ ] Add shiprocket config to `config/index.ts`
- [ ] Create `src/adapters/shiprocket/shiprocket.adapter.ts`
- [ ] Register in `CourierFactory`
- [ ] Add env vars: `SHIPROCKET_API_URL`, `SHIPROCKET_API_KEY`
- [ ] Test with API
- [ ] Commit changes

### Adding BlueDart
- [ ] Add `BLUEDART: "bluedart"` to constants
- [ ] Add bluedart config to `config/index.ts`
- [ ] Create `src/adapters/bluedart/bluedart.adapter.ts`
- [ ] Register in `CourierFactory`
- [ ] Add env vars: `BLUEDART_API_URL`, `BLUEDART_API_KEY`
- [ ] Test with API
- [ ] Commit changes

---

## 💾 Copy-Paste Template

Use this minimal template for any new courier:

```typescript
// src/adapters/{courier_name}/{courier_name}.adapter.ts

import { CourierProvider, CreateShipmentDto, CreateShipmentResponse, TrackingResponse, CancelShipmentResponse } from "../../types";
import { BaseCourierClient } from "../../utils/courier-client";
import { config } from "../../config";
import { loggerService } from "../../services/logger.service";

export class {CourierName}Adapter extends BaseCourierClient implements CourierProvider {
  constructor() {
    super("{CourierName}");
  }

  async authenticate(): Promise<void> {
    // TODO: Implement authentication
  }

  async createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse> {
    await this.authenticate();
    // TODO: Implement shipment creation
    return {} as CreateShipmentResponse;
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    await this.authenticate();
    // TODO: Implement tracking
    return {} as TrackingResponse;
  }

  async cancelShipment(shipmentId: string): Promise<CancelShipmentResponse> {
    await this.authenticate();
    // TODO: Implement cancellation
    return {} as CancelShipmentResponse;
  }
}
```

---

## 🚀 You're Ready!

✅ 5 steps  
✅ 5 minutes  
✅ Any courier  

**Go add that courier!** 🎉

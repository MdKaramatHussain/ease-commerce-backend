import { MockCourierAdapter } from "../../src/adapters/mockcourier/mockcourier.adapter";
import { CreateShipmentDto, ShipmentStatus } from "../../src/types";

describe("Mock Courier Adapter", () => {
  let adapter: MockCourierAdapter;

  beforeEach(() => {
    adapter = new MockCourierAdapter();
  });

  it("should authenticate successfully", async () => {
    await expect(adapter.authenticate()).resolves.toBeUndefined();
  });

  it("should create shipment", async () => {
    await adapter.authenticate();

    const payload: CreateShipmentDto = {
      order_id: "ORD123",
      courier_partner: "mockcourier",
      customer: {
        name: "John Doe",
        phone: "9999999999",
      },
      address: {
        line1: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
    };

    const response = await adapter.createShipment(payload);

    expect(response.success).toBe(true);
    expect(response.courier_order_id).toBeDefined();
    expect(response.awb_number).toBeDefined();
    expect(response.order_id).toBe("ORD123");
  });

  it("should track shipment", async () => {
    await adapter.authenticate();

    const response = await adapter.trackShipment("AWB123456");

    expect(response.awb_number).toBe("AWB123456");
    expect(response.status).toBeDefined();
    expect(response.events).toBeInstanceOf(Array);
  });

  it("should cancel shipment", async () => {
    await adapter.authenticate();

    const response = await adapter.cancelShipment("MOCK_SHIPMENT_123");

    expect(response.success).toBe(true);
    expect(response.shipment_id).toBe("MOCK_SHIPMENT_123");
  });
});

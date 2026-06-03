import { CourierProvider, CreateShipmentDto, CreateShipmentResponse, TrackingResponse, CancelShipmentResponse } from "../../types";
import { generateAwbNumber } from "../../utils/retry";
import { loggerService } from "../../services/logger.service";
import { v4 as uuidv4 } from "uuid";

/**
 * Mock Courier Adapter
 * Demonstrates the plug-and-play courier integration pattern.
 * Can be used for testing without actual courier API calls.
 */
export class MockCourierAdapter implements CourierProvider {
  private mockShipments: Map<string, any> = new Map();

  async authenticate(): Promise<void> {
    loggerService.debug("MockCourier: Simulating authentication");
    // Mock authentication - always succeeds
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse> {
    loggerService.debug("MockCourier: Creating mock shipment", { orderId: payload.order_id });

    const awbNumber = generateAwbNumber();
    const courierOrderId = `MOCK_${uuidv4()}`;

    // Simulate shipment creation
    this.mockShipments.set(awbNumber, {
      courier_order_id: courierOrderId,
      awb_number: awbNumber,
      order_id: payload.order_id,
      status: "CREATED",
      created_at: new Date(),
      tracking_events: [
        {
          status: "CREATED",
          location: "Mumbai",
          timestamp: new Date(),
          description: "Shipment created",
        },
      ],
    });

    return {
      success: true,
      courier_order_id: courierOrderId,
      awb_number: awbNumber,
      order_id: payload.order_id,
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      status: "CREATED",
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    loggerService.debug("MockCourier: Tracking shipment", { awbNumber });

    const shipment = this.mockShipments.get(awbNumber);

    if (!shipment) {
      // Simulate tracking data for any AWB
      return {
        awb_number: awbNumber,
        order_id: "UNKNOWN",
        status: "IN_TRANSIT",
        current_location: "Delhi",
        last_update: new Date().toISOString(),
        events: [
          {
            status: "PICKED_UP",
            location: "Mumbai",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            description: "Shipment picked up",
          },
          {
            status: "IN_TRANSIT",
            location: "Delhi",
            timestamp: new Date().toISOString(),
            description: "In transit to destination",
          },
        ],
      };
    }

    return {
      awb_number: awbNumber,
      order_id: shipment.order_id,
      status: shipment.status,
      current_location: "In Transit",
      last_update: new Date().toISOString(),
      events: shipment.tracking_events,
    };
  }

  async cancelShipment(shipmentId: string): Promise<CancelShipmentResponse> {
    loggerService.debug("MockCourier: Cancelling shipment", { shipmentId });

    const shipment = Array.from(this.mockShipments.values()).find(
      (s) => s.courier_order_id === shipmentId
    );

    if (shipment) {
      shipment.status = "CANCELLED";
    }

    return {
      success: true,
      shipment_id: shipmentId,
      message: "Shipment cancelled successfully",
    };
  }
}

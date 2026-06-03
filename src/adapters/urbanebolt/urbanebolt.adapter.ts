import { CourierProvider, CreateShipmentDto, CreateShipmentResponse, TrackingResponse, CancelShipmentResponse } from "../../types";
import { BaseCourierClient } from "../../utils/courier-client";
import { config } from "../../config";
import { cacheService } from "../../cache/cache.service";
import { CACHE_KEYS, CACHE_TTL } from "../../constants";
import { loggerService } from "../../services/logger.service";
import { CourierAuthError } from "../../utils/errors";

export class UrbaneboltAdapter extends BaseCourierClient implements CourierProvider {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    super("UrbaneBolt");
    this.clientId = config.courier.urbanebolt.clientId;
    this.clientSecret = config.courier.urbanebolt.clientSecret;
  }

  async authenticate(): Promise<void> {
    const cacheKey = CACHE_KEYS.COURIER_AUTH_TOKEN("urbanebolt");
    
    // Check cache first
    const cachedToken = cacheService.get<string>(cacheKey);
    if (cachedToken) {
      this.authToken = cachedToken;
      loggerService.debug("Using cached UrbaneBolt auth token");
      return;
    }

    try {
      const response = await this.request<{ token: string }>(
        "post",
        `${config.courier.urbanebolt.apiUrl}/auth/login`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }
      );

      this.authToken = response.token;
      cacheService.set(cacheKey, response.token, CACHE_TTL.AUTH_TOKEN);
      loggerService.info("UrbaneBolt authentication successful");
    } catch (error) {
      loggerService.error("UrbaneBolt authentication failed", error as Error);
      throw new CourierAuthError("Failed to authenticate with UrbaneBolt");
    }
  }

  async createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse> {
    await this.authenticate();

    const response = await this.request<{
      shipment_id: string;
      awb: string;
      status: string;
      estimated_delivery: string;
    }>(
      "post",
      `${config.courier.urbanebolt.apiUrl}/shipments`,
      this.transformCreateShipmentPayload(payload)
    );

    loggerService.info("UrbaneBolt shipment created", {
      orderId: payload.order_id,
      awb: response.awb,
    });

    return {
      success: true,
      courier_order_id: response.shipment_id,
      awb_number: response.awb,
      order_id: payload.order_id,
      estimated_delivery: response.estimated_delivery,
      status: response.status,
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    await this.authenticate();

    const response = await this.request<{
      awb: string;
      status: string;
      current_location: string;
      last_update: string;
      events: any[];
    }>(
      "get",
      `${config.courier.urbanebolt.apiUrl}/shipments/${awbNumber}/track`
    );

    return {
      awb_number: response.awb,
      order_id: awbNumber, // In real scenario, would need to fetch from DB
      status: response.status,
      current_location: response.current_location,
      last_update: response.last_update,
      events: response.events.map((event: any) => ({
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
      `${config.courier.urbanebolt.apiUrl}/shipments/${shipmentId}/cancel`
    );

    loggerService.info("UrbaneBolt shipment cancelled", {
      shipmentId,
    });

    return {
      success: true,
      shipment_id: response.shipment_id,
      message: response.message,
    };
  }

  private transformCreateShipmentPayload(payload: CreateShipmentDto): Record<string, any> {
    return {
      order_id: payload.order_id,
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email,
      },
      pickup_address: {
        // Default warehouse - in production would be configurable
        name: "Warehouse",
        phone: "9999999999",
        address: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      delivery_address: {
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

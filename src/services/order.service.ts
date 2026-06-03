import { OrderRepository, TrackingRepository } from "../repositories";
import { CourierFactory } from "../factories/CourierFactory";
import { CreateOrderRequest, ShipmentStatus, CreateShipmentResponse } from "../types";
import { cacheService } from "../cache/cache.service";
import { CACHE_KEYS, CACHE_TTL } from "../constants";
import { loggerService } from "./logger.service";
import { DuplicateOrderError } from "../utils/errors";

export class OrderService {
  private orderRepository: OrderRepository;
  private trackingRepository: TrackingRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.trackingRepository = new TrackingRepository();
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateShipmentResponse> {
    loggerService.info("Creating order", { orderId: request.order_id });

    // Check for duplicate - idempotency
    const existingOrder = await this.orderRepository.findByOrderId(request.order_id);
    if (existingOrder) {
      loggerService.warn("Order already exists (idempotency)", { orderId: request.order_id });
      throw new DuplicateOrderError(request.order_id);
    }

    // Get courier adapter
    const courier = CourierFactory.getCourier(request.courier_partner);

    // Create shipment with courier
    const shipmentResponse = await courier.createShipment(request);

    // Store order in database
    await this.orderRepository.create({
      order_id: request.order_id,
      courier_partner: request.courier_partner,
      status: ShipmentStatus.CREATED,
      request_payload: request,
    });

    // Update order with courier response
    await this.orderRepository.updateByOrderId(request.order_id, {
      courier_order_id: shipmentResponse.courier_order_id,
      awb_number: shipmentResponse.awb_number,
      status: ShipmentStatus.CREATED,
      response_payload: shipmentResponse,
    });

    loggerService.info("Order created successfully", {
      orderId: request.order_id,
      awbNumber: shipmentResponse.awb_number,
    });

    return shipmentResponse;
  }

  async trackOrder(orderId: string) {
    loggerService.info("Tracking order", { orderId });

    const order = await this.orderRepository.findByOrderId(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!order.awb_number) {
      throw new Error(`AWB number not found for order ${orderId}`);
    }

    // Check cache
    const cacheKey = CACHE_KEYS.ORDER_TRACKING(order.awb_number);
    const cachedTracking = cacheService.get(cacheKey);
    if (cachedTracking) {
      loggerService.debug("Returning cached tracking data", { orderId });
      return cachedTracking;
    }

    // Get courier adapter and track
    const courier = CourierFactory.getCourier(order.courier_partner);
    const trackingData = await courier.trackShipment(order.awb_number);

    // Cache tracking data
    cacheService.set(cacheKey, trackingData, CACHE_TTL.TRACKING_DATA);

    // Store tracking history (append-only)
    if (trackingData.events && trackingData.events.length > 0) {
      for (const event of trackingData.events) {
        await this.trackingRepository.create({
          order_id: orderId,
          status: event.status,
          raw_payload: event,
          event_time: new Date(event.timestamp),
        });
      }
    }

    loggerService.info("Order tracked successfully", {
      orderId,
      status: trackingData.status,
    });

    return trackingData;
  }

  async cancelOrder(orderId: string) {
    loggerService.info("Cancelling order", { orderId });

    const order = await this.orderRepository.findByOrderId(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!order.courier_order_id) {
      throw new Error(`Courier order ID not found for ${orderId}`);
    }

    // Get courier adapter and cancel
    const courier = CourierFactory.getCourier(order.courier_partner);
    const cancelResponse = await courier.cancelShipment(order.courier_order_id);

    // Update order status
    await this.orderRepository.updateByOrderId(orderId, {
      status: ShipmentStatus.CANCELLED,
    });

    loggerService.info("Order cancelled successfully", { orderId });

    return cancelResponse;
  }

  async getOrder(orderId: string) {
    const order = await this.orderRepository.findByOrderId(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    return order;
  }

  async listOrders(limit: number = 100, offset: number = 0) {
    return this.orderRepository.findAll(limit, offset);
  }
}

export const orderService = new OrderService();

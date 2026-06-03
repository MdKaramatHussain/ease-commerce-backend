import { Router, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { batchService } from "../services/batch.service";
import { loggerService } from "../services/logger.service";
import { CreateOrderRequest, BulkCreateOrderRequest } from "../types";
import { validate, createOrderValidationSchema, bulkCreateOrdersValidationSchema } from "../validators";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware";
import { ValidationError } from "../utils/errors";

const router = Router();

// Apply auth middleware to all order routes
router.use(authMiddleware);

interface OrderReq extends AuthenticatedRequest {
  requestId?: string;
}

/**
 * POST /api/v1/orders
 * Create a single order
 */
router.post("/", async (req: OrderReq, res: Response, next: NextFunction) => {
  try {
    loggerService.info("Create order request", {
      orderId: req.body.order_id,
      requestId: req.requestId,
    });

    const { value, error } = validate(createOrderValidationSchema, req.body);

    if (error) {
      const details: Record<string, string> = {};
      error.details.forEach((detail) => {
        details[detail.path.join(".")] = detail.message;
      });
      throw new ValidationError("Validation failed", details);
    }

    const result = await orderService.createOrder(value as CreateOrderRequest);

    res.status(201).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/orders/bulk
 * Create multiple orders in a batch
 */
router.post("/bulk", async (req: OrderReq, res: Response, next: NextFunction) => {
  try {
    loggerService.info("Bulk create orders request", {
      totalOrders: req.body.orders?.length,
      requestId: req.requestId,
    });

    const { value, error } = validate(bulkCreateOrdersValidationSchema, req.body);

    if (error) {
      const details: Record<string, string> = {};
      error.details.forEach((detail) => {
        details[detail.path.join(".")] = detail.message;
      });
      throw new ValidationError("Validation failed", details);
    }

    const result = await batchService.createBatch(
      (value as BulkCreateOrderRequest).orders
    );

    res.status(202).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/orders/:orderId
 * Get order details
 */
router.get("/:orderId", async (req: OrderReq, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params as { orderId: string };
    loggerService.info("Get order request", { orderId, requestId: req.requestId });

    const order = await orderService.getOrder(orderId);

    res.status(200).json({
      success: true,
      data: order,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/orders/:orderId/track
 * Track order shipment
 */
router.get("/:orderId/track", async (req: OrderReq, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params as { orderId: string };
    loggerService.info("Track order request", { orderId, requestId: req.requestId });

    const tracking = await orderService.trackOrder(orderId);

    res.status(200).json({
      success: true,
      data: tracking,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/orders/:orderId/cancel
 * Cancel order
 */
router.post("/:orderId/cancel", async (req: OrderReq, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params as { orderId: string };
    loggerService.info("Cancel order request", { orderId, requestId: req.requestId });

    const result = await orderService.cancelOrder(orderId);

    res.status(200).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/orders
 * List all orders (with pagination)
 */
router.get("/", async (req: OrderReq, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    loggerService.info("List orders request", { limit, offset, requestId: req.requestId });

    const result = await orderService.listOrders(limit, offset);

    res.status(200).json({
      success: true,
      data: {
        orders: result.rows,
        total: result.count,
        limit,
        offset,
      },
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

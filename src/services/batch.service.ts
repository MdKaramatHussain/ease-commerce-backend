// import { BatchRepository, OrderRepository } from "../repositories";
import { BatchRepository } from "../repositories";
import { BatchStatus, CreateOrderRequest } from "../types";
import { generateBatchId } from "../utils/retry";
import { loggerService } from "./logger.service";
import { orderService } from "./order.service";

export class BatchService {
  private batchRepository: BatchRepository;
  // private orderRepository: OrderRepository;

  constructor() {
    this.batchRepository = new BatchRepository();
    // this.orderRepository = new OrderRepository();
  }

  async createBatch(orders: CreateOrderRequest[]) {
    const batchId = generateBatchId();

    loggerService.info("Creating batch", {
      batchId,
      totalOrders: orders.length,
    });

    // Create batch record with PENDING status
    const batch = await this.batchRepository.create({
      batch_id: batchId,
      status: BatchStatus.PENDING,
      total_orders: orders.length,
      success_count: 0,
      failed_count: 0,
    });

    // Process orders asynchronously in background (non-blocking)
    this.processBatchInBackground(batchId, orders);

    return {
      success: true,
      batch_id: batchId,
      total_orders: orders.length,
      status: BatchStatus.PENDING,
      created_at: batch.created_at,
    };
  }

  private async processBatchInBackground(batchId: string, orders: CreateOrderRequest[]): Promise<void> {
    try {
      // Update batch status to PROCESSING
      await this.batchRepository.update(batchId, {
        status: BatchStatus.PROCESSING,
      });

      loggerService.info("Processing batch", { batchId, totalOrders: orders.length });

      // Process orders concurrently using Promise.allSettled
      const results = await Promise.allSettled(
        orders.map((order) => orderService.createOrder(order))
      );

      let successCount = 0;
      let failedCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
          loggerService.debug("Batch order created", {
            batchId,
            orderId: orders[index].order_id,
          });
        } else {
          failedCount++;
          loggerService.error("Batch order failed", result.reason, {
            batchId,
            orderId: orders[index].order_id,
          });
        }
      });

      // Determine final status
      let finalStatus = BatchStatus.COMPLETED;
      if (failedCount === orders.length) {
        finalStatus = BatchStatus.FAILED;
      } else if (failedCount > 0) {
        finalStatus = BatchStatus.PARTIAL_SUCCESS;
      }

      // Update batch with final status
      await this.batchRepository.update(batchId, {
        status: finalStatus,
        success_count: successCount,
        failed_count: failedCount,
      });

      loggerService.info("Batch processing completed", {
        batchId,
        status: finalStatus,
        successCount,
        failedCount,
      });
    } catch (error) {
      loggerService.error("Batch processing error", error as Error, { batchId });
      await this.batchRepository.update(batchId, {
        status: BatchStatus.FAILED,
      });
    }
  }

  async getBatchStatus(batchId: string) {
    loggerService.info("Getting batch status", { batchId });

    const batch = await this.batchRepository.findByBatchId(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    return {
      batch_id: batch.batch_id,
      status: batch.status,
      total_orders: batch.total_orders,
      success_count: batch.success_count,
      failed_count: batch.failed_count,
      created_at: batch.created_at,
      updated_at: batch.updated_at,
    };
  }

  async listBatches(limit: number = 50, offset: number = 0) {
    return this.batchRepository.findAll(limit, offset);
  }
}

export const batchService = new BatchService();

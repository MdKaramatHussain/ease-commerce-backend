import { Router, Response, NextFunction } from "express";
import { batchService } from "../services/batch.service";
import { loggerService } from "../services/logger.service";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware";

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

interface BatchReq extends AuthenticatedRequest {
  requestId?: string;
}

/**
 * GET /api/v1/batches/:batchId
 * Get batch status
 */
router.get("/:batchId", async (req: BatchReq, res: Response, next: NextFunction) => {
  try {
    const { batchId } = req.params as { batchId: string };
    loggerService.info("Get batch status request", { batchId, requestId: req.requestId });

    const batch = await batchService.getBatchStatus(batchId);

    res.status(200).json({
      success: true,
      data: batch,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/batches
 * List all batches
 */
router.get("/", async (req: BatchReq, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    loggerService.info("List batches request", { limit, offset, requestId: req.requestId });

    const result = await batchService.listBatches(limit, offset);

    res.status(200).json({
      success: true,
      data: {
        batches: result.rows,
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

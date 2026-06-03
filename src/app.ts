import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { loggerService } from "./services/logger.service";
import { sequelize } from "./database/models";
import { requestIdMiddleware, errorHandlingMiddleware } from "./middleware/auth.middleware";

import authRoutes from "./routes/auth.routes";
import ordersRoutes from "./routes/orders.routes";
import batchesRoutes from "./routes/batches.routes";

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use(requestIdMiddleware);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Service is healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const apiVersion = config.app.apiVersion;
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/orders`, ordersRoutes);
app.use(`/api/${apiVersion}/batches`, batchesRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

// Error handling middleware
app.use(errorHandlingMiddleware);

// Initialize database and start server
export async function startServer() {
  try {
    // Sync database
    await sequelize.authenticate();
    loggerService.info("Database connection established");

    await sequelize.sync({ alter: true });
    loggerService.info("Database models synced");

    // Start server
    const port = config.app.port;
    app.listen(port, () => {
      loggerService.info(`Server started on port ${port}`, {
        environment: config.app.env,
        apiVersion,
      });
    });
  } catch (error) {
    loggerService.error("Failed to start server", error as Error);
    process.exit(1);
  }
}

export default app;

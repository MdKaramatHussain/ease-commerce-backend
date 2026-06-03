#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs all database migrations in order
 */

import { sequelize } from "../../src/database/models";
import { loggerService } from "../../src/services/logger.service";

async function runMigrations() {
  try {
    loggerService.info("Starting database migrations...");

    // Authenticate to database
    await sequelize.authenticate();
    loggerService.info("Database connection established");

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    loggerService.info("Database models synced successfully");

    loggerService.info("All migrations completed");
    process.exit(0);
  } catch (error) {
    loggerService.error("Migration failed", error as Error);
    process.exit(1);
  }
}

runMigrations();

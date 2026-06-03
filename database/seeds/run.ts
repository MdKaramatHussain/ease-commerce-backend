import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { sequelize, User } from "../src/database/models";
import { loggerService } from "../src/services/logger.service";

async function seedDatabase() {
  try {
    loggerService.info("Starting database seed...");

    // Sync database
    await sequelize.sync({ alter: true });

    // Create admin user
    const adminPassword = await bcrypt.hash("admin@123", 10);
    await User.create({
      id: uuidv4(),
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    });

    loggerService.info("Admin user created", { email: "admin@example.com" });

    // Create operator user
    const operatorPassword = await bcrypt.hash("operator@123", 10);
    await User.create({
      id: uuidv4(),
      email: "operator@example.com",
      password: operatorPassword,
      role: "OPERATOR",
    });

    loggerService.info("Operator user created", { email: "operator@example.com" });

    loggerService.info("Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    loggerService.error("Database seeding failed", error as Error);
    process.exit(1);
  }
}

seedDatabase();

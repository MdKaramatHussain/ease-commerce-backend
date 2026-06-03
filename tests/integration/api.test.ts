import request from "supertest";
import app from "../../src/app";

describe("API Integration Tests", () => {
  let accessToken: string;
  let refreshToken: string;

  describe("Authentication Endpoints", () => {
    it("should login successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin@example.com",
          password: "admin@123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();

      accessToken = response.body.data.access_token;
      refreshToken = response.body.data.refresh_token;
    });

    it("should fail with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "invalid@example.com",
          password: "invalid",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({
          refresh_token: refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();
    });
  });

  describe("Order Endpoints", () => {
    it("should create an order", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          order_id: "TEST001",
          courier_partner: "mockcourier",
          customer: {
            name: "Test Customer",
            phone: "9999999999",
          },
          address: {
            line1: "123 Test St",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.courier_order_id).toBeDefined();
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .send({
          order_id: "TEST002",
          courier_partner: "mockcourier",
          customer: {
            name: "Test Customer",
            phone: "9999999999",
          },
          address: {
            line1: "123 Test St",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
        });

      expect(response.status).toBe(401);
    });

    it("should fail validation with invalid order_id", async () => {
      const response = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          order_id: "A", // Too short
          courier_partner: "mockcourier",
          customer: {
            name: "Test Customer",
            phone: "9999999999",
          },
          address: {
            line1: "123 Test St",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should list orders", async () => {
      const response = await request(app)
        .get("/api/v1/orders?limit=10&offset=0")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeInstanceOf(Array);
    });
  });

  describe("Batch Endpoints", () => {
    let batchId: string;

    it("should create a batch", async () => {
      const response = await request(app)
        .post("/api/v1/orders/bulk")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          orders: [
            {
              order_id: "BATCH001",
              courier_partner: "mockcourier",
              customer: {
                name: "Customer 1",
                phone: "9999999999",
              },
              address: {
                line1: "Street 1",
                city: "Mumbai",
                state: "Maharashtra",
                pincode: "400001",
              },
            },
            {
              order_id: "BATCH002",
              courier_partner: "mockcourier",
              customer: {
                name: "Customer 2",
                phone: "9999999998",
              },
              address: {
                line1: "Street 2",
                city: "Delhi",
                state: "Delhi",
                pincode: "110001",
              },
            },
          ],
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch_id).toBeDefined();
      expect(response.body.data.status).toBe("PENDING");

      batchId = response.body.data.batch_id;
    });

    it("should get batch status", async () => {
      if (!batchId) {
        this.skip();
      }

      const response = await request(app)
        .get(`/api/v1/batches/${batchId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batch_id).toBe(batchId);
    });
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app)
        .get("/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

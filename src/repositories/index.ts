import { Order, User, TrackingHistory, Batch } from "../database/models";
import { ShipmentStatus } from "../types";
// import { CreateOrderRequest, ShipmentStatus } from "../types";
// import { loggerService } from "../services/logger.service";

export class OrderRepository {
  async findByOrderId(orderId: string): Promise<Order | null> {
    return Order.findOne({
      where: { order_id: orderId },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return Order.findByPk(id);
  }

  async findByAwb(awbNumber: string): Promise<Order | null> {
    return Order.findOne({
      where: { awb_number: awbNumber },
    });
  }

  async create(data: {
    order_id: string;
    courier_partner: string;
    status: ShipmentStatus;
    request_payload: Record<string, any>;
  }): Promise<Order> {
    return Order.create(data as any);
  }

  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    await Order.update(data, {
      where: { id },
    });
    return this.findById(id);
  }

  async updateByOrderId(
    orderId: string,
    data: Partial<Order>
  ): Promise<Order | null> {
    await Order.update(data, {
      where: { order_id: orderId },
    });
    return this.findByOrderId(orderId);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<{
    rows: Order[];
    count: number;
  }> {
    return Order.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Order.destroy({
      where: { id },
    });
    return result > 0;
  }
}

export class TrackingRepository {
  async create(data: {
    order_id: string;
    status: string;
    raw_payload: Record<string, any>;
    event_time: Date;
  }): Promise<TrackingHistory> {
    return TrackingHistory.create(data as any);
  }

  async findByOrderId(orderId: string): Promise<TrackingHistory[]> {
    return TrackingHistory.findAll({
      where: { order_id: orderId },
      order: [["event_time", "DESC"]],
    });
  }

  async getLatestTracking(orderId: string): Promise<TrackingHistory | null> {
    return TrackingHistory.findOne({
      where: { order_id: orderId },
      order: [["event_time", "DESC"]],
    });
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<{
    rows: TrackingHistory[];
    count: number;
  }> {
    return TrackingHistory.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  }
}

export class BatchRepository {
  async create(data: {
    batch_id: string;
    status: string;
    total_orders: number;
    success_count?: number;
    failed_count?: number;
  }): Promise<Batch> {
    return Batch.create(data as any);
  }

  async findByBatchId(batchId: string): Promise<Batch | null> {
    return Batch.findOne({
      where: { batch_id: batchId },
    });
  }

  async findById(id: string): Promise<Batch | null> {
    return Batch.findByPk(id);
  }

  async update(batchId: string, data: Partial<Batch>): Promise<Batch | null> {
    await Batch.update(data, {
      where: { batch_id: batchId },
    });
    return this.findByBatchId(batchId);
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<{
    rows: Batch[];
    count: number;
  }> {
    return Batch.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
  }
}

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async create(data: {
    email: string;
    password: string;
    role: string;
  }): Promise<User> {
    return User.create(data as any);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<{
    rows: User[];
    count: number;
  }> {
    return User.findAndCountAll({
      limit,
      offset,
      attributes: { exclude: ["password"] },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await User.update(data, {
      where: { id },
    });
    return this.findById(id);
  }
}

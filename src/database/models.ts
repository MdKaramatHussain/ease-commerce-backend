import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import { config } from "../config";

const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: "mysql" as any,
    logging: config.database.logging ? console.log : false,
    pool: config.database.pool,
  }
);

// Order Model
interface OrderAttributes {
  id: string;
  order_id: string;
  courier_partner: string;
  courier_order_id?: string;
  awb_number?: string;
  status: string;
  request_payload: Record<string, any>;
  response_payload?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, "id"> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public order_id!: string;
  public courier_partner!: string;
  public courier_order_id?: string;
  public awb_number?: string;
  public status!: string;
  public request_payload!: Record<string, any>;
  public response_payload?: Record<string, any>;
  public created_at?: Date;
  public updated_at?: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    courier_partner: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    courier_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    awb_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "CREATED",
    },
    request_payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    response_payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    
  }
);

// Tracking History Model
interface TrackingHistoryAttributes {
  id: string;
  order_id: string;
  status: string;
  raw_payload: Record<string, any>;
  event_time: Date;
  created_at?: Date;
}

interface TrackingHistoryCreationAttributes extends Optional<TrackingHistoryAttributes, "id" | "created_at"> {}

export class TrackingHistory extends Model<TrackingHistoryAttributes, TrackingHistoryCreationAttributes> implements TrackingHistoryAttributes {
  public id!: string;
  public order_id!: string;
  public status!: string;
  public raw_payload!: Record<string, any>;
  public event_time!: Date;
  public created_at?: Date;
}

TrackingHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    raw_payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    event_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "tracking_history",
    timestamps: true,
    updatedAt: false,
  }
);

// Batch Model
interface BatchAttributes {
  id: string;
  batch_id: string;
  status: string;
  total_orders: number;
  success_count: number;
  failed_count: number;
  created_at?: Date;
  updated_at?: Date;
}

interface BatchCreationAttributes extends Optional<BatchAttributes, "id"> {}

export class Batch extends Model<BatchAttributes, BatchCreationAttributes> implements BatchAttributes {
  public id!: string;
  public batch_id!: string;
  public status!: string;
  public total_orders!: number;
  public success_count!: number;
  public failed_count!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

Batch.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    batch_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "PENDING",
    },
    total_orders: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    success_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    failed_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "batches",
    timestamps: true,
  }
);

// User Model
interface UserAttributes {
  id: string;
  email: string;
  password: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public role!: string;
  public created_at?: Date;
  public updated_at?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("ADMIN", "OPERATOR"),
      allowNull: false,
      defaultValue: "OPERATOR",
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  }
);

export { sequelize };

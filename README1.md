# Ease Commerce - Multi-Courier Integration Platform

Production-ready backend application for managing shipments across multiple courier partners.

## Features

✅ **Multi-Courier Integration** - Unified API for multiple courier partners
✅ **Design Patterns** - Strategy, Adapter, Factory, Repository patterns
✅ **JWT Authentication** - Role-based access control (ADMIN, OPERATOR)
✅ **Bulk Order Processing** - Non-blocking batch processing with Promise.allSettled()
✅ **Idempotency** - Duplicate order prevention
✅ **Caching** - In-memory cache for tokens and tracking data
✅ **Retry Mechanism** - Exponential backoff for courier API calls
✅ **Comprehensive Logging** - Winston logger with file rotation
✅ **Production-Ready** - Error handling, validation, security
✅ **API Versioning** - /api/v1/ endpoints
✅ **Database Models** - Orders, Tracking History, Batches, Users
✅ **Docker Support** - Docker and docker-compose setup

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT
- **Validation**: Joi
- **HTTP Client**: Axios with retry logic
- **Logging**: Winston
- **Testing**: Jest
- **Containerization**: Docker

## Project Structure

```
src/
├── modules/
│   ├── auth/
│   ├── orders/
│   ├── courier/
│   └── batches/
├── adapters/
│   ├── urbanebolt/
│   └── mockcourier/
├── factories/
│   └── CourierFactory.ts
├── repositories/
│   └── index.ts (OrderRepository, TrackingRepository, etc.)
├── services/
│   ├── order.service.ts
│   ├── batch.service.ts
│   ├── auth.service.ts
│   ├── logger.service.ts
│   └── cache.service.ts
├── middleware/
│   └── auth.middleware.ts
├── validators/
│   └── index.ts
├── cache/
│   └── cache.service.ts
├── config/
│   └── index.ts
├── utils/
│   ├── retry.ts
│   ├── errors.ts
│   └── courier-client.ts
├── database/
│   └── models.ts
├── routes/
│   ├── auth.routes.ts
│   ├── orders.routes.ts
│   └── batches.routes.ts
├── types/
│   └── index.ts
├── constants/
│   └── index.ts
└── app.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ease-commerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

### Docker Setup

1. **Build and run with Docker Compose**
   ```bash
   npm run docker:up
   ```

2. **Stop Docker services**
   ```bash
   npm run docker:down
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signin` | signin and get tokens |
| POST | `/api/v1/auth/login` | Login and get tokens |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create single order |
| POST | `/api/v1/orders/bulk` | Create multiple orders (batch) |
| GET | `/api/v1/orders/:orderId` | Get order details |
| GET | `/api/v1/orders/:orderId/track` | Track order shipment |
| POST | `/api/v1/orders/:orderId/cancel` | Cancel order |
| GET | `/api/v1/orders` | List orders |

### Batches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/batches/:batchId` | Get batch status |
| GET | `/api/v1/batches` | List batches |

## Usage Examples

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

### Create Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "order_id": "ORD123",
    "courier_partner": "urbanebolt",
    "customer": {
      "name": "John Doe",
      "phone": "9999999999"
    },
    "address": {
      "line1": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  }'
```

### Bulk Create Orders

```bash
curl -X POST http://localhost:3000/api/v1/orders/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "orders": [
      {
        "order_id": "ORD001",
        "courier_partner": "urbanebolt",
        "customer": { "name": "Customer 1", "phone": "9999999999" },
        "address": { "line1": "Street 1", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001" }
      },
      {
        "order_id": "ORD002",
        "courier_partner": "mockcourier",
        "customer": { "name": "Customer 2", "phone": "9999999998" },
        "address": { "line1": "Street 2", "city": "Delhi", "state": "Delhi", "pincode": "110001" }
      }
    ]
  }'
```

### Track Order

```bash
curl -X GET http://localhost:3000/api/v1/orders/ORD123/track \
  -H "Authorization: Bearer <access_token>"
```

## Courier Integration

### Supported Couriers

- **UrbaneBolt** - Full implementation
- **MockCourier** - For testing/demo (plug-and-play adapter)

### Adding a New Courier

1. **Create adapter** in `src/adapters/{courier-name}/`
2. **Implement `CourierProvider` interface**:
   ```typescript
   export class NewCourierAdapter implements CourierProvider {
     async authenticate(): Promise<void> { }
     async createShipment(payload: CreateShipmentDto): Promise<CreateShipmentResponse> { }
     async trackShipment(awbNumber: string): Promise<TrackingResponse> { }
     async cancelShipment(shipmentId: string): Promise<CancelShipmentResponse> { }
   }
   ```
3. **Register in factory**:
   ```typescript
   CourierFactory.registerAdapter("newcourier", () => new NewCourierAdapter());
   ```

That's it! No changes needed to controllers, routes, or business logic.

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  courier_partner VARCHAR(50) NOT NULL,
  courier_order_id VARCHAR(100),
  awb_number VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL,
  request_payload JSON NOT NULL,
  response_payload JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Tracking History Table
```sql
CREATE TABLE tracking_history (
  id UUID PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  raw_payload JSON NOT NULL,
  event_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP
);
```

### Batches Table
```sql
CREATE TABLE batches (
  id UUID PRIMARY KEY,
  batch_id VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  total_orders INT NOT NULL,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'OPERATOR') DEFAULT 'OPERATOR',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Error Handling

All errors follow a standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req_123456789"
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNKNOWN_COURIER` - Courier not supported
- `COURIER_TIMEOUT` - Courier API timeout
- `COURIER_AUTH_FAILED` - Courier authentication failed
- `COURIER_API_ERROR` - Courier API error
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ORDER` - Order already exists

## Caching Strategy

- **Courier Auth Tokens** - 30 minutes (configurable)
- **Tracking Data** - 1 hour (configurable)
- **Batch Status** - 1 hour (configurable)

## Environment Variables

See `.env.example` for complete configuration options.

## Logging

Logs are stored in `./logs/` directory with rotation:
- `combined.log` - All logs
- `error.log` - Error logs only

## Health Check

```bash
curl http://localhost:3000/health
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Update all credentials in `.env`
3. Enable HTTPS in reverse proxy (nginx, etc.)
4. Set up proper database backups
5. Monitor logs and metrics
6. Configure CORS properly
7. Set strong JWT secrets

## Contributing

1. Create feature branch
2. Follow SOLID principles
3. Write tests for new features
4. Update documentation
5. Submit pull request

## License

ISC

## Support

For issues and questions, please create a GitHub issue.

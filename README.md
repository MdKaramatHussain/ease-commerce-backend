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

4. **Start development server**
   ```bash
   npm start
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
| GET | `/api/v1/batches

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
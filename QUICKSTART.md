# Quick Start Guide

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## 5-Minute Setup

### 1. Clone & Install

```bash
cd ease-commerce
npm install
```

### 2. Configure Database

```bash
# Edit .env with your MySQL credentials
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=ease_commerce
```

### 3. Setup Database

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Login

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin@123`
- Role: ADMIN

**Operator Account:**
- Email: `operator@example.com`
- Password: `operator@123`
- Role: OPERATOR

## First API Call

### 1. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin@123"
  }'
```

Copy the `access_token` from response.

### 2. Create Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "order_id": "ORD123",
    "courier_partner": "mockcourier",
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

### 3. Track Order

```bash
curl -X GET http://localhost:3000/api/v1/orders/ORD123/track \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Docker Setup

```bash
# Build and run
npm run docker:up

# View logs
docker-compose logs -f app

# Stop services
npm run docker:down
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test:coverage
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build TypeScript
npm run format       # Format code
npm run lint         # Lint code

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed data

# Docker
npm run docker:up    # Start Docker
npm run docker:down  # Stop Docker

# Production
npm run build
npm start
```

## Project Structure

```
src/
├── adapters/        # Courier integrations
├── factories/       # Courier factory
├── repositories/    # Data access
├── services/        # Business logic
├── middleware/      # Auth, logging
├── validators/      # Input validation
├── routes/          # API endpoints
└── app.ts           # Express app
```

## Next Steps

1. Review [README.md](README.md) for detailed setup
2. Read [DESIGN.md](DESIGN.md) for architecture
3. Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
4. Import [postman-collection.json](postman-collection.json) in Postman

## Courier Integration

### Using UrbaneBolt

Set your UrbaneBolt credentials in `.env`:

```env
URBANEBOLT_API_URL=https://api.urbanebolt.com
URBANEBOLT_CLIENT_ID=your_client_id
URBANEBOLT_CLIENT_SECRET=your_client_secret
URBANEBOLT_API_KEY=your_api_key
```

Then create orders with:
```json
{
  "courier_partner": "urbanebolt",
  ...
}
```

### Using Mock Courier

Mock courier is enabled by default for testing:

```json
{
  "courier_partner": "mockcourier",
  ...
}
```

## Add New Courier

1. Create adapter in `src/adapters/new-courier/`
2. Implement `CourierProvider` interface
3. Register in `CourierFactory`:

```typescript
CourierFactory.registerAdapter("newcourier", () => new NewCourierAdapter());
```

That's it! Your courier is ready to use.

## Troubleshooting

### Database Connection Error

```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in .env
# Ensure database exists
mysql -u root -p -e "CREATE DATABASE ease_commerce"
```

### Port 3000 Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill the process
lsof -i :3000
kill -9 <PID>
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

## Documentation

- **API Docs**: Use [Postman collection](postman-collection.json)
- **Architecture**: See [DESIGN.md](DESIGN.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## Support

For help:
1. Check existing documentation
2. Review code comments
3. Check logs in `./logs/`
4. Open an issue

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Sequelize Documentation](https://sequelize.org/)
- [JWT Documentation](https://jwt.io/)
- [Docker Documentation](https://docs.docker.com/)

## Happy Coding! 🚀

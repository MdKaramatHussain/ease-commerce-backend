# Ease Commerce - Contributing Guide

## Code Quality Standards

### TypeScript

- ✅ Strict mode enabled
- ✅ No implicit `any`
- ✅ Explicit return types for functions
- ✅ Prefer `const` over `let`

### Naming Conventions

```typescript
// Classes - PascalCase
class OrderService { }

// Functions/Methods - camelCase
function createOrder() { }

// Constants - UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Private fields - _camelCase prefix
private _authToken: string;

// Interfaces - PascalCase with optional 'I' prefix
interface OrderProvider { }
```

### Folder Organization

- **Modules**: Business domain logic
- **Services**: Business logic & orchestration
- **Repositories**: Data access layer
- **Adapters**: External service integration
- **Middleware**: Express middleware
- **Utils**: Utility functions & helpers
- **Types**: TypeScript type definitions
- **Constants**: Application constants
- **Config**: Configuration management

### Comments

```typescript
// Good: Explains WHY, not WHAT
// Check cache first to reduce database load
const cached = cache.get(key);

// Bad: Obvious from code
const x = 5; // Set x to 5
```

## Testing

### Unit Tests

```typescript
describe("OrderService", () => {
  it("should create order successfully", async () => {
    // Arrange
    const orderData = { /* ... */ };
    
    // Act
    const result = await service.createOrder(orderData);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Test Coverage

- Minimum: 50%
- Target: 70%+
- Critical paths: 90%+

## Code Review Checklist

- [ ] Code follows SOLID principles
- [ ] Error handling is comprehensive
- [ ] Logging is appropriate
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No hardcoded values (use config)
- [ ] Validation is present
- [ ] Security is considered
- [ ] Performance is optimized
- [ ] No console.log (use logger)

## Commit Convention

```
feat: Add new courier adapter
fix: Fix token caching issue
docs: Update README
refactor: Restructure order service
test: Add integration tests
chore: Update dependencies
```

## Pull Request Process

1. Create feature branch: `git checkout -b feat/my-feature`
2. Make changes and commit
3. Write/update tests
4. Run linting: `npm run lint`
5. Format code: `npm run format`
6. Create pull request with description
7. Ensure CI/CD passes
8. Request review
9. Address feedback
10. Merge when approved

## Error Handling Best Practices

```typescript
// Good: Specific error types
if (result.status === 401) {
  throw new CourierAuthError("Invalid credentials");
}

// Avoid: Generic errors
throw new Error("Something went wrong");
```

## Logging Best Practices

```typescript
// Good: Structured logging with context
loggerService.info("Order created", {
  orderId: order.id,
  courier: order.courier_partner,
  requestId: context.requestId,
});

// Avoid: Unstructured logging
console.log("Created order", order);
```

## Performance Guidelines

- Use indexes on frequently queried columns
- Cache expensive operations
- Batch process large datasets
- Use connection pooling
- Prefer async/await over callbacks
- Implement pagination for list endpoints

## Security Guidelines

- Never log sensitive data (passwords, tokens)
- Validate and sanitize all inputs
- Use parameterized queries (done by Sequelize)
- Implement rate limiting
- Use HTTPS in production
- Rotate secrets regularly
- Use environment variables for config

## Deployment Checklist

- [ ] All tests pass
- [ ] Coverage meets minimum threshold
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Performance tested
- [ ] Security checked
- [ ] Rollback plan prepared

## Questions?

Create an issue or contact the team for clarification.

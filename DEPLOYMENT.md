# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code coverage ≥ 50%
- [ ] Code reviewed
- [ ] Security scan completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Backup strategy ready
- [ ] Monitoring setup complete
- [ ] Load testing completed

## Development Deployment

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with local configuration

# Start development server
npm run dev
```

## Production Build

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build TypeScript
npm run build

# Run production server
npm start
```

## Docker Deployment

### Build Image

```bash
docker build -t ease-commerce:latest .
docker tag ease-commerce:latest ease-commerce:v1.0.0
```

### Push to Registry

```bash
# Docker Hub
docker tag ease-commerce:latest username/ease-commerce:latest
docker push username/ease-commerce:latest

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag ease-commerce:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/ease-commerce:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ease-commerce:latest
```

## Docker Compose Deployment

### Local/Staging

```bash
# Create environment file
cp .env.example .env.staging
# Edit .env.staging

# Build and run
docker-compose -f docker-compose.yml up --build

# Stop services
docker-compose down
```

### Production

```bash
# Create production compose file
cp docker-compose.yml docker-compose.prod.yml
# Edit docker-compose.prod.yml for production settings

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## Kubernetes Deployment

### Prerequisites

- kubectl configured
- Docker image pushed to registry
- ConfigMap and Secrets created

### Create Deployment

```bash
# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Apply Secrets
kubectl apply -f k8s/secrets.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml

# Create service
kubectl apply -f k8s/service.yaml

# Verify deployment
kubectl get pods
kubectl get svc
```

### Example Deployment YAML

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ease-commerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ease-commerce
  template:
    metadata:
      labels:
        app: ease-commerce
    spec:
      containers:
      - name: ease-commerce
        image: your-registry/ease-commerce:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: ease-commerce-config
              key: db_host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ease-commerce-secrets
              key: db_password
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## AWS Deployment

### Using RDS for Database

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier ease-commerce-db \
  --db-instance-class db.t2.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20
```

### Using ECS for Application

```bash
# Create ECR repository
aws ecr create-repository --repository-name ease-commerce

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker tag ease-commerce:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/ease-commerce:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ease-commerce:latest

# Create ECS cluster
aws ecs create-cluster --cluster-name ease-commerce

# Create task definition and service
```

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/ease-commerce
upstream ease_commerce {
  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
}

server {
  listen 80;
  server_name api.example.com;

  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Headers
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;

  location / {
    proxy_pass http://ease_commerce;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Database Migration

### Initial Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Backup

```bash
# MySQL backup
mysqldump -u root -p ease_commerce > backup.sql

# Restore from backup
mysql -u root -p ease_commerce < backup.sql
```

## Monitoring & Logging

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/app.js --name "ease-commerce"

# Monitoring
pm2 monit

# Logs
pm2 logs ease-commerce
```

### ELK Stack

```yaml
# docker-compose-logging.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
```

## Health Checks

```bash
# Application health
curl -X GET http://localhost:3000/health

# Database health
mysql -u root -p -e "SELECT 1"

# Response should be healthy if all services are running
```

## Rollback Strategy

### In case of issues

```bash
# Rollback Docker image
docker stop ease-commerce
docker rm ease-commerce
docker run -d --name ease-commerce <previous-image>

# Rollback database
mysql -u root -p ease_commerce < backup-before-migration.sql
```

## Performance Optimization

### Database

- Enable query caching
- Add appropriate indexes
- Use connection pooling
- Regular maintenance

### Application

- Enable gzip compression
- Implement rate limiting
- Use caching headers
- CDN for static assets

### Infrastructure

- Load balancing
- Auto-scaling
- Database replication
- Backup strategy

## Security Hardening

- ✅ Enable HTTPS
- ✅ Update all dependencies
- ✅ Use strong secrets
- ✅ Enable CORS properly
- ✅ Implement rate limiting
- ✅ Regular security audits
- ✅ Monitor logs
- ✅ Implement WAF rules

## Scaling

### Horizontal Scaling

```
Load Balancer (Nginx/AWS ELB)
├── App Instance 1
├── App Instance 2
└── App Instance 3
    ↓
MySQL Database (with read replicas)
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Upgrade database instance class

## Maintenance

- Update dependencies regularly
- Monitor performance metrics
- Review and rotate logs
- Perform security patches
- Regular backups
- Test disaster recovery

## Support & Troubleshooting

### Common Issues

**Issue**: Application not connecting to database
```bash
# Check MySQL status
systemctl status mysql

# Verify credentials
mysql -u user -p -h host database
```

**Issue**: High memory usage
```bash
# Check memory usage
pm2 monit

# Increase Node.js memory
node --max-old-space-size=4096 dist/app.js
```

**Issue**: Slow API responses
```bash
# Check logs for slow queries
tail -f logs/combined.log

# Analyze query performance
EXPLAIN SELECT ...
```

# AI-Powered Distributed Healthcare Diagnosis System

## Architecture Overview

```
Client → API Gateway (8080) → [Auth | Diagnosis | Patient | Notification] Services
                                        ↓
                              AI Service (Python FastAPI 8085)
                                        ↓
                         [PostgreSQL | MongoDB | Redis | Kafka]
```

## Services

| Service              | Port | Tech          | Database     |
|----------------------|------|---------------|--------------|
| API Gateway          | 8080 | Spring Cloud  | -            |
| Auth Service         | 8081 | Spring Boot   | PostgreSQL   |
| Diagnosis Service    | 8082 | Spring Boot   | Redis (cache)|
| Patient Records      | 8083 | Spring Boot   | MongoDB      |
| Notification Service | 8084 | Spring Boot   | -            |
| AI Service           | 8085 | Python FastAPI| -            |

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Java 17+ (for local dev)
- Python 3.11+ (for local dev)

### 1. Copy your trained models
```bash
# From project root
cp Models/*.sav healthcare-system/ai-service/models/
```

### 2. Start everything with Docker Compose
```bash
cd healthcare-system
docker-compose up --build
```

### 3. Test the system
```bash
# Register a user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"pass123","fullName":"John Doe"}'

# Login and get token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"pass123"}'

# Run a diabetes prediction (use token from login)
curl -X POST http://localhost:8080/api/diagnosis/predict \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "diseaseType": "diabetes",
    "features": {
      "Pregnancies": 2, "Glucose": 120, "BloodPressure": 70,
      "SkinThickness": 20, "Insulin": 80, "BMI": 25.5,
      "DiabetesPedigreeFunction": 0.5, "Age": 35
    }
  }'
```

## How Services Connect

```
1. Client sends request → API Gateway
2. Gateway validates JWT token (except /auth/* routes)
3. Gateway routes to correct microservice + adds X-User-Id header
4. Diagnosis Service → calls AI Service (REST) → caches in Redis
5. Diagnosis Service → publishes to Kafka topic "diagnosis-results"
6. Notification Service → consumes Kafka → pushes WebSocket notification
7. Patient Records Service → also consumes Kafka → saves history to MongoDB
```

## WebSocket Notifications (Real-time)

Connect from frontend:
```javascript
const socket = new SockJS('http://localhost:8084/ws');
const stompClient = Stomp.over(socket);
stompClient.connect({}, () => {
  stompClient.subscribe('/topic/notifications/<userId>', (msg) => {
    console.log('Notification:', msg.body);
  });
});
```

## Folder Structure

```
healthcare-system/
├── docker-compose.yml          ← Starts all services + infra
├── api-gateway/                ← Routes + JWT validation
│   └── src/.../JwtAuthFilter   ← Validates token on every request
├── auth-service/               ← Register/Login → returns JWT
│   └── src/.../security/       ← BCrypt + JWT generation
├── diagnosis-service/          ← Calls AI, caches in Redis, fires Kafka
│   └── src/.../kafka/          ← Publishes diagnosis events
├── patient-records-service/    ← MongoDB patient history
├── notification-service/       ← Kafka consumer + WebSocket push
└── ai-service/                 ← Python FastAPI wrapping your .sav models
    ├── main.py                 ← All 5 disease prediction endpoints
    └── models/                 ← Copy your .sav files here
```

## Environment Variables (Production)

Change these in docker-compose.yml before deploying:
- `JWT_SECRET` → use a 256-bit random string
- `POSTGRES_PASSWORD` → strong password
- All service URLs → use actual hostnames/IPs

## Deployment on AWS

1. Push images to ECR: `aws ecr get-login-password | docker login ...`
2. Use ECS Fargate for each service (auto-scaling)
3. Use RDS for PostgreSQL, DocumentDB for MongoDB, ElastiCache for Redis
4. Use MSK (Managed Kafka) instead of self-hosted Kafka
5. Put ALB in front of API Gateway

# MyPSECar - Backend Development Project (PSE 2025)

A full-stack automotive showcase application demonstrating modern backend architecture with REST APIs, real-time MQTT messaging, 3D visualization, and containerized deployments.

## Features

### 1. Car Configurator
- Interactive 3D car customization using Three.js
- Real-time color selection and visualization
- Dynamic pricing calculator
- Wheel and interior package selection

### 2. Cars Overview
- Browse all available car models
- Filter by specifications and configurations
- Compare different vehicle options
- Detailed car information modals

### 3. World Drive
- Real-time supercar tracking via MQTT
- Interactive world map with live GPS coordinates
- Location history and route visualization
- WebSocket integration for live updates

### 4. Merchandise Shop
- E-commerce platform for branded merchandise
- Shopping cart with session management
- Category filtering (Apparel, Accessories, Collectibles)
- Secure checkout process

### 5. My PSE Car
- Personal vehicle dashboard
- Real-time vehicle statistics
- Fuel gauge and performance metrics
- Vehicle selector for multiple cars

## Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd backend_modul_pse_25
cp .env.example .env
```

### 2. Start Infrastructure

Start PostgreSQL, MQTT broker (Mosquitto), and MinIO:

```bash
docker compose --profile dev up -d
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

```bash
cd packages/backend
npx prisma migrate dev
npx prisma db seed  # Optional: seed with sample data
cd ../..
```

### 5. Start the Application

**Option A: Start everything at once**
```bash
npm run dev
```

**Option B: Start services separately**
```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

### 6. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main web application |
| Backend API | http://localhost:4000 | REST API endpoints |
| API Docs | http://localhost:4000/api-docs | Swagger documentation |
| MinIO Console | http://localhost:9002 | Object storage UI |
| PostgreSQL | localhost:5432 | Database |
| MQTT Broker | localhost:1883 | MQTT TCP |
| MQTT WebSocket | localhost:9001 | MQTT over WebSocket |

**Default MinIO credentials:**
- Username: `minioadmin`
- Password: `minioadmin`

## Demo Walkthrough

### Homepage
- Beautiful hero section with automotive imagery
- "DRIVE THE BACKEND" tagline
- Feature module cards for easy navigation

### Car Configurator Demo
1. Navigate to Car Configurator
2. View the 3D car model (PSE Model S)
3. Select different exterior colors:
   - Arctic White (base)
   - Midnight Black (+$1,500)
   - Racing Red (+$2,000)
   - Ocean Blue (+$1,800)
   - Silver Metallic (+$1,200)
   - Storm Gray (+$1,000)
4. Watch the 3D model update in real-time
5. Use mouse controls:
   - **Rotate:** Click and drag
   - **Zoom:** Scroll or pinch
   - **Pan:** Right-click and drag

### World Drive Demo
1. Navigate to World Drive
2. View the interactive map of Europe
3. MQTT connection establishes automatically
4. Subscribes to `car/supercar/gps` topic
5. Run simulation script to see live tracking:
   ```bash
   npm run simulate:supercar
   ```

### Merchandise Shop Demo
1. Navigate to Merchandise
2. Browse products by category
3. Add items to cart
4. View cart and proceed to checkout

## Architecture

```
packages/
├── frontend/          # Next.js 15 application
│   ├── app/
│   │   ├── (features)/
│   │   │   ├── car-configurator/
│   │   │   ├── car-overview/
│   │   │   ├── world-drive/
│   │   │   ├── merchandise/
│   │   │   └── MyPSECar/
│   │   └── _components/
│   └── public/
└── backend/           # Express.js microservice
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    └── src/
        ├── routes/
        │   ├── cars.ts
        │   ├── products.ts
        │   ├── cart.ts
        │   ├── orders.ts
        │   ├── vehicles.ts
        │   └── supercar.ts
        ├── index.ts
        ├── db.ts
        ├── mqtt.ts
        ├── mqtt-client.ts
        ├── mqtt-handlers.ts
        ├── websocket.ts
        └── minio.ts
```

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **3D Graphics:** Three.js, React Three Fiber
- **Maps:** Leaflet, React Leaflet
- **Real-time:** MQTT.js, WebSocket

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Message Broker:** Mosquitto (MQTT)
- **Object Storage:** MinIO
- **API Documentation:** Swagger/OpenAPI
- **Real-time:** WebSocket, MQTT

### Infrastructure
- **Containerization:** Docker, Docker Compose
- **Database:** PostgreSQL 17
- **Message Broker:** Eclipse Mosquitto
- **Object Storage:** MinIO

## API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI:** http://localhost:4000/api-docs
- **OpenAPI Specs:**
  - Cars API: `/openapi-cars.yaml`
  - Merchandise API: `/openapi-merchandise.yaml`
  - World Drive API: `/openapi-worlddrive.yaml`

## Development Commands

```bash
# Install dependencies
npm install

# Start development servers
npm run dev                    # Start both frontend and backend
npm run dev:frontend           # Frontend only
npm run dev:backend            # Backend only

# Database operations
cd packages/backend
npx prisma migrate dev         # Create and apply migrations
npx prisma db seed             # Seed database with sample data
npx prisma studio              # Open Prisma Studio GUI

# Simulation scripts
npm run simulate:vehicle       # Simulate regular vehicle data
npm run simulate:supercar      # Simulate supercar GPS tracking

# Docker operations
docker compose --profile dev up -d      # Start infrastructure
docker compose --profile prod up --build # Full production stack
docker compose down                      # Stop all services
docker compose logs -f backend          # View backend logs
```

## Testing MQTT

### Subscribe to topics:
```bash
# Using mosquitto_sub
mosquitto_sub -h localhost -p 1883 -t "car/supercar/gps"
mosquitto_sub -h localhost -p 1883 -t "car/+/telemetry"
```

### Publish test messages:
```bash
# Publish supercar location
mosquitto_pub -h localhost -p 1883 -t "car/supercar/gps" \
  -m '{"latitude":48.8566,"longitude":2.3522,"speed":120,"timestamp":"2024-01-01T12:00:00Z"}'
```

## Database Schema

Key models:
- **Car:** Vehicle models with specifications
- **Configuration:** Saved car configurations
- **Product:** Merchandise items
- **Cart/CartItem:** Shopping cart management
- **Order/OrderItem:** Order processing
- **Vehicle:** User's personal vehicles
- **VehicleTelemetry:** Real-time vehicle data
- **SuperCar:** Tracked supercars with GPS

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/psecar"

# Backend
BACKEND_PORT=3001

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_WS_URL=ws://localhost:9001

# Frontend (optional override)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Troubleshooting

### Port already in use
```bash
# Find and kill process using port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database connection issues
```bash
# Restart PostgreSQL container
docker compose restart postgres

# Check if PostgreSQL is running
docker compose ps postgres
```

### MQTT connection issues
```bash
# Restart Mosquitto broker
docker compose restart mosquitto

# Test MQTT connection
mosquitto_sub -h localhost -p 1883 -t "test"
```

### Clear all data and restart
```bash
docker compose down -v
docker compose --profile dev up -d
cd packages/backend
npx prisma migrate reset
```

## Additional Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture_diagram.md](docs/architecture_diagram.md) | System architecture overview |
| [docs/database.md](docs/database.md) | Database schema and Prisma guide |
| [docs/docker.md](docs/docker.md) | Docker setup and commands |
| [docs/mqtt.md](docs/mqtt.md) | MQTT topics and messaging patterns |
| [requirements_docs/](requirements_docs/) | Project requirements and specifications |


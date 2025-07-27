# MVP Train Tracking - Entity Relationship Diagram

## Architecture Overview
**Express.js Backend Architecture**: Expo frontend calling Express.js API server that processes location + line input through MTA APIs and returns real-time results.

## No Persistent Data Storage
This is a completely stateless system with no database requirements.

## External Data Sources Only

### MTA GTFS-RT API
- Real-time train positions and vehicle updates
- Trip updates with arrival predictions
- Accessed directly from Express API server

### MTA Static GTFS Data  
- Station coordinates and names
- Route information and stop sequences
- Downloaded/parsed as needed (or cached in Express server memory)

## Express.js API Server Architecture

### Single Express Application: `train-identification-api`

**Runtime**: Node.js 18+ with TypeScript
**Framework**: Express.js with CORS, logging, and validation middleware
**Memory**: Configurable via Docker container limits
**Environment Variables**:
- `MTA_API_KEY` (from environment variables or Docker secrets)

### Express API Request Flow

**Input Request:**
```http
POST /api/identify-train
Content-Type: application/json

{
  "latitude": 40.7589,
  "longitude": -73.9851,
  "line_code": "6"
}
```

**Processing Steps:**
1. Express middleware validates and parses request body
2. Query MTA static GTFS data for nearest stations on specified line
3. Call MTA GTFS-RT API for current trains near those stations  
4. Calculate best train match based on position/direction/timing
5. Fetch arrival predictions for next 3 stops from GTFS-RT
6. Format and return JSON response

**Output Response:**
```json
{
  "train_id": "6_051500_6..N03R",
  "line": {
    "code": "6", 
    "name": "6 Express",
    "color": "#00933C"
  },
  "direction": "Downtown & Brooklyn",
  "current_station": "59 St-Lexington Av",
  "next_stops": [...],
  "service_type": "express",
  "last_updated": "2025-07-27T15:21:15Z"
}
```

## Docker Infrastructure Components

### Express API Server
- REST API endpoints: `/api/identify-train`, `/api/health`
- CORS middleware enabled for Expo web/mobile requests
- Request validation and error handling middleware
- Built-in request logging and monitoring

### Docker Container
- Node.js 18+ runtime environment
- Express server handling all train identification logic
- MTA API integration and response formatting
- Environment variable configuration for API keys

### Environment Configuration
- Secure storage for MTA API keys via environment variables
- Docker compose environment variable integration
- Development/production environment separation

### Basic Monitoring
- Express server request/response logging
- Error tracking and console output
- Container health checks

## Deployment Architecture

### Repository Structure
```
/what-train-am-i-on-app
├── apps/
│   ├── mobile/           # Expo TypeScript app
│   └── api/              # Express API server source
├── packages/
│   └── shared/           # Shared TypeScript types
├── .github/workflows/    # GitHub Actions CI/CD
├── docker-compose.yml    # Docker development environment
└── package.json          # Monorepo configuration
```

### CI/CD Pipeline (GitHub Actions)
1. **Test**: Run TypeScript checks and unit tests
2. **Build**: Test Docker builds for both API and mobile apps
3. **Deploy API**: Basic production deployment for Express server
4. **Deploy Frontend**: 
   - Web: Build Expo web → Static hosting (Netlify/Vercel)
   - Mobile: EAS Build for app stores (future)

## Local Development Environment

### Docker Setup
```
/what-train-am-i-on-app
├── docker-compose.yml           # Orchestrates all services
├── apps/
│   ├── mobile/
│   │   ├── Dockerfile          # Expo development server
│   │   └── package.json
│   └── api/
│       ├── Dockerfile          # Express API server
│       └── package.json
├── packages/
│   └── shared/                 # Shared TypeScript types
└── .env.local.example          # Environment variables template
```

### Docker Services Configuration

**docker-compose.yml:**
```yaml
services:
  mobile:
    build:
      context: ./apps/mobile
      dockerfile: Dockerfile
    ports:
      - "19000:8081"   # Metro bundler  
      - "8081:8081"    # Web interface
    volumes:
      - ./apps/mobile:/app
      - /app/node_modules
    environment:
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

  api:
    build:
      context: ./apps/api  
      dockerfile: Dockerfile
    ports:
      - "3000:3000"    # Express API server
    volumes:
      - ./apps/api:/app
      - /app/node_modules
    environment:
      - MTA_API_KEY=${MTA_API_KEY}
      - NODE_ENV=development
```

### Development Workflow
1. **Start Environment**: `docker-compose up`
2. **Expo Development**: 
   - Web: `http://localhost:8081`
   - Mobile: Expo Go app connects to Metro bundler
3. **Express API**: `http://localhost:3000/api/hello`
4. **Hot Reload**: Both frontend and backend auto-reload on changes
5. **Shared Types**: TypeScript interfaces sync across containers

### Local Express Development
- Native Express.js server running in Docker container
- Standard Node.js development workflow
- Same Express app runs in dev and production
- Environment variables loaded from `.env.local` or Docker environment

### Benefits
- Consistent development environment across team
- No need to install Node.js/Expo CLI locally
- Easy MTA API key management via environment variables
- Isolated dependencies and runtime environments
- Simple Express.js development workflow

## No Database Schema
- No persistent storage required
- All data fetched fresh from MTA APIs on each request
- Express API server is completely stateless
- Memory-only caching within single Express server instance
# MVP Train Tracking - Entity Relationship Diagram

## Architecture Overview
**Serverless AWS Architecture**: Expo frontend calling single AWS Lambda function that processes location + line input through MTA APIs and returns real-time results.

## No Persistent Data Storage
This is a completely stateless system with no database requirements.

## External Data Sources Only

### MTA GTFS-RT API
- Real-time train positions and vehicle updates
- Trip updates with arrival predictions
- Accessed directly from Lambda function

### MTA Static GTFS Data  
- Station coordinates and names
- Route information and stop sequences
- Downloaded/parsed as needed (or cached in Lambda memory)

## AWS Lambda Function Architecture

### Single Function: `identify-train`

**Runtime**: Node.js 18+ with TypeScript
**Memory**: 512MB (sufficient for MTA API calls)
**Timeout**: 30 seconds
**Environment Variables**:
- `MTA_API_KEY` (from AWS Systems Manager Parameter Store)

### Lambda Handler Flow

**Input Event:**
```json
{
  "body": "{\"latitude\": 40.7589, \"longitude\": -73.9851, \"line_code\": \"6\"}"
}
```

**Processing Steps:**
1. Parse and validate request body
2. Query MTA static GTFS data for nearest stations on specified line
3. Call MTA GTFS-RT API for current trains near those stations  
4. Calculate best train match based on position/direction/timing
5. Fetch arrival predictions for next 3 stops from GTFS-RT
6. Format and return response

**Output Response:**
```json
{
  "statusCode": 200,
  "body": "{
    \"train_id\": \"6_051500_6..N03R\",
    \"line\": {
      \"code\": \"6\", 
      \"name\": \"6 Express\",
      \"color\": \"#00933C\"
    },
    \"direction\": \"Downtown & Brooklyn\",
    \"current_station\": \"59 St-Lexington Av\",
    \"next_stops\": [...],
    \"service_type\": \"express\",
    \"last_updated\": \"2025-07-27T15:21:15Z\"
  }"
}
```

## AWS Infrastructure Components

### API Gateway
- REST API endpoint: `/api/identify-train`
- CORS enabled for Expo web/mobile requests
- Request validation and throttling

### Lambda Function
- Single function handling all train identification logic
- MTA API integration and response formatting
- No VPC required (public internet access for MTA APIs)

### Systems Manager Parameter Store
- Secure storage for MTA API keys
- Accessed by Lambda at runtime

### CloudWatch
- Lambda function logs and metrics
- Error monitoring and alerting

## Deployment Architecture

### Repository Structure
```
/what-train-am-i-on-app
├── apps/
│   ├── mobile/           # Expo TypeScript app
│   └── api/              # Lambda function source
├── shared/               # Shared TypeScript types
├── infrastructure/       # AWS SAM templates
├── .github/workflows/    # GitHub Actions CI/CD
└── package.json          # Monorepo configuration
```

### CI/CD Pipeline (GitHub Actions)
1. **Test**: Run TypeScript checks and unit tests
2. **Build**: Compile Expo app and Lambda function
3. **Deploy Lambda**: Use AWS SAM to deploy function + API Gateway
4. **Deploy Frontend**: 
   - Web: Build Expo web → S3 + CloudFront
   - Mobile: EAS Build for app stores

## Local Development Environment

### Docker Setup
```
/what-train-am-i-on-app
├── docker-compose.yml           # Orchestrates all services
├── docker-compose.override.yml  # Local dev overrides
├── apps/
│   ├── mobile/
│   │   ├── Dockerfile.dev      # Expo development server
│   │   └── package.json
│   └── api/
│       ├── Dockerfile.dev      # Lambda simulation
│       └── package.json
├── shared/                     # Shared TypeScript types
└── .env.local                  # Local environment variables
```

### Docker Services Configuration

**docker-compose.yml:**
```yaml
services:
  expo-app:
    build:
      context: ./apps/mobile
      dockerfile: Dockerfile.dev
    ports:
      - "19006:19006"  # Expo web
      - "19000:19000"  # Expo Metro bundler
    volumes:
      - ./apps/mobile:/app
      - ./shared:/app/shared
    environment:
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

  lambda-api:
    build:
      context: ./apps/api  
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"    # Local API server
    volumes:
      - ./apps/api:/app
      - ./shared:/app/shared
    environment:
      - MTA_API_KEY=${MTA_API_KEY}
      - NODE_ENV=development
```

### Development Workflow
1. **Start Environment**: `docker-compose up`
2. **Expo Development**: 
   - Web: `http://localhost:19006`
   - Mobile: Expo Go app connects to Metro bundler
3. **Lambda API**: `http://localhost:3001/api/identify-train`
4. **Hot Reload**: Both frontend and backend auto-reload on changes
5. **Shared Types**: TypeScript interfaces sync across containers

### Local Lambda Simulation
- Uses `aws-lambda-ric` (Runtime Interface Client) in container
- Simulates AWS Lambda environment locally
- Same handler code runs in dev and production
- Environment variables loaded from `.env.local`

### Benefits
- Consistent development environment across team
- No need to install Node.js/Expo CLI locally
- Easy MTA API key management via environment variables
- Isolated dependencies and runtime environments

## No Database Schema
- No persistent storage required
- All data fetched fresh from MTA APIs on each request
- Lambda function is completely stateless
- Memory-only caching within single Lambda execution context
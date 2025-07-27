# MVP Train Tracking - Development Ticket Plan

## Executive Summary
- **Total Estimated Effort**: 26-34 story points (6-8 weeks for 2-3 developers)
- **Number of Milestones**: 4 milestones (2-week sprints each)
- **Key Risks**: MTA API integration complexity, geolocation accuracy, Docker environment setup
- **Recommended Team Size**: 2-3 developers (1 frontend, 1 backend, 1 DevOps/fullstack)

## Milestone Breakdown

### Milestone 1: Project Foundation & Infrastructure (2 weeks)
**Goal**: Establish development environment, repository structure, and basic CI/CD pipeline

#### Core Infrastructure Tickets
- **[INFRA] Setup Local Development Environment** - 8 points
- **[INFRA] Setup AWS Infrastructure with SAM Templates** - 5 points
- **[INFRA] Configure GitHub Actions CI/CD Pipeline** - 3 points
- **[INFRA] Setup Shared TypeScript Types Package** - 2 points

**Milestone Total**: 18 points
**Dependencies**: Local Development Environment must be completed first (blocks all other development)
**Parallel Work Streams**: 
- Any developer: Setup Local Development Environment (must be done first)
- DevOps engineer: AWS Infrastructure, CI/CD Pipeline (after local dev setup)
- Frontend/Backend developer: Shared TypeScript Types (after local dev setup)

---

### Milestone 2: Backend API Development (2 weeks)  
**Goal**: Implement core Lambda function with MTA API integration

#### Backend Development Tickets
- **[API-001] - Setup Lambda Function Project Structure** - 2 points
- **[API-002] - Implement MTA GTFS Static Data Parser** - 5 points
- **[API-003] - Integrate MTA GTFS-RT API Client** - 5 points
- **[API-004] - Develop Train Identification Algorithm** - 8 points
- **[API-005] - Implement API Request/Response Handling** - 3 points
- **[API-006] - Add Error Handling and Edge Cases** - 3 points
- **[API-007] - Setup AWS Parameter Store for API Keys** - 2 points

**Milestone Total**: 28 points
**Dependencies**: INFRA-003 (AWS infrastructure must be ready)
**Parallel Work Streams**:
- Backend developer: API-001, API-002, API-003 (sequential)
- Backend developer: API-004, API-005 (after API-003 complete)
- DevOps engineer: API-007 (parallel with API development)

---

### Milestone 3: Frontend Application Development (2 weeks)
**Goal**: Build Expo application with train identification UI

#### Frontend Development Tickets  
- **[UI-001] - Setup Expo Project with TypeScript** - 2 points
- **[UI-002] - Implement Geolocation Service** - 3 points
- **[UI-003] - Create Train Line Selection Component** - 3 points
- **[UI-004] - Develop Train Results Display Component** - 5 points
- **[UI-005] - Implement API Client for Backend Integration** - 3 points
- **[UI-006] - Add Loading States and Error Handling** - 3 points
- **[UI-007] - Style Application with MTA Design System** - 3 points
- **[UI-008] - Implement Manual Station Selection Fallback** - 2 points

**Milestone Total**: 24 points
**Dependencies**: INFRA-002 (Docker environment), API-005 (API contract)
**Parallel Work Streams**:
- Frontend developer: UI-001, UI-002, UI-003 (sequential start)
- Frontend developer: UI-004, UI-007 (after UI-003)
- Frontend developer: UI-005, UI-006 (after API-005 complete)

---

### Milestone 4: Integration, Testing & Deployment (2 weeks)
**Goal**: End-to-end integration, testing, and production deployment

#### Integration & Testing Tickets
- **[TEST-001] - Write Unit tests for Lambda Function** - 3 points
- **[TEST-002] - Write Component Tests for Expo App** - 3 points  
- **[TEST-003] - Implement End-to-End Integration Tests** - 5 points
- **[TEST-004] - Performance Testing and Optimization** - 3 points
- **[DEPLOY-001] - Deploy Lambda Function to AWS Production** - 2 points
- **[DEPLOY-002] - Deploy Expo Web App to S3/CloudFront** - 3 points
- **[DEPLOY-003] - Configure Production Monitoring** - 2 points
- **[QA-001] - User Acceptance Testing with Real MTA Data** - 3 points

**Milestone Total**: 24 points
**Dependencies**: All previous milestones must be complete
**Parallel Work Streams**:
- Backend developer: TEST-001, TEST-003
- Frontend developer: TEST-002, TEST-003  
- DevOps engineer: DEPLOY-001, DEPLOY-002, DEPLOY-003

---

## Detailed Ticket Specifications

### Infrastructure Tickets

#### [INFRA] Setup Local Development Environment
**Priority**: Critical  
**Complexity**: High  
**Skills Required**: Docker, Node.js, Expo, TypeScript, Monorepo setup

**Description**: Create complete local development environment with monorepo structure, Docker containers, and basic hello-world implementations for both frontend and backend.

**Acceptance Criteria**:
- Monorepo structure: `/apps/mobile/`, `/apps/api/`, `/packages/shared/`
- Root `package.json` with npm workspaces configuration
- `docker-compose.yml` with expo-app and lambda-api services
- Expo app runs on ports 19000 (Metro) and 19006 (web) with "Hello World"
- Lambda API runs on port 3001 with basic "/hello" endpoint
- Shared TypeScript types package with basic interfaces
- Volume mounts for hot reload during development
- Environment variable configuration (`.env.local.example`)
- All services start successfully with `docker-compose up`
- Basic TypeScript, ESLint, and Prettier configuration

**Dependencies**: None (this is the foundation ticket)  
**Definition of Done**: 
- Developer runs `docker-compose up` and sees both services running
- Expo web shows "Hello World" at `localhost:19006`
- API returns JSON response at `localhost:3001/hello`
- Hot reload works for both frontend and backend changes

**Estimated Effort**: 8 points

---

#### [INFRA] Setup AWS Infrastructure with SAM Templates
**Priority**: High  
**Complexity**: High  
**Skills Required**: AWS SAM, API Gateway, Lambda, CloudFormation

**Description**: Define Infrastructure as Code using AWS SAM for deploying Lambda function, API Gateway, and supporting AWS services.

**Acceptance Criteria**:
- `template.yaml` SAM template defining Lambda function and API Gateway
- API Gateway with CORS configuration for Expo web/mobile
- Lambda function with proper IAM roles and permissions
- Systems Manager Parameter Store for MTA API keys
- CloudWatch Log Groups for monitoring
- Local testing with `sam local start-api`

**Dependencies**: Setup Local Development Environment  
**Definition of Done**: `sam deploy` successfully creates AWS infrastructure and API is accessible

---

#### [INFRA] Configure GitHub Actions CI/CD Pipeline
**Priority**: Medium  
**Complexity**: Medium  
**Skills Required**: GitHub Actions, AWS CLI, Node.js

**Description**: Automate testing, building, and deployment process using GitHub Actions workflows.

**Acceptance Criteria**:
- `.github/workflows/ci.yml` for running tests and TypeScript checks
- `.github/workflows/deploy-api.yml` for Lambda function deployment
- `.github/workflows/deploy-web.yml` for Expo web app deployment
- Branch protection requiring passing tests before merge
- AWS credentials securely stored in GitHub Secrets
- Deployment only triggers on main branch pushes
- Build artifacts properly cached between runs

**Dependencies**: INFRA-001, INFRA-003  
**Definition of Done**: Code changes automatically test and deploy through GitHub Actions

---

#### [INFRA] Setup Shared TypeScript Types Package
**Priority**: Medium  
**Complexity**: Low  
**Skills Required**: TypeScript, NPM packages

**Description**: Create shared TypeScript interfaces and types that can be imported by both frontend and backend applications.

**Acceptance Criteria**:
- `shared/types/` directory with API request/response interfaces
- MTA data structures (Line, Station, Train, Arrival) defined
- Error response types and success response types
- Export configuration allowing imports from both apps
- Type definitions match ERD API specifications
- Automated TypeScript compilation for the shared package

**Dependencies**: Setup Local Development Environment  
**Definition of Done**: Both apps can import and use shared types without errors

---

### Backend API Development Tickets

#### [API] Setup Lambda Function Project Structure
**Priority**: High  
**Complexity**: Low  
**Skills Required**: Node.js, TypeScript, AWS Lambda

**Description**: Initialize Lambda function project with proper TypeScript configuration and AWS Lambda Runtime Interface.

**Acceptance Criteria**:
- `apps/api/src/` directory structure with handler.ts entry point
- TypeScript configuration compatible with AWS Lambda
- Package.json with required dependencies (aws-lambda-ric, MTA API clients)
- Basic handler function that responds to HTTP events
- Lambda function can be invoked locally using sam local
- Environment variable configuration for development/production

**Dependencies**: INFRA-001, INFRA-002  
**Definition of Done**: Lambda function returns "Hello World" response when invoked

---

#### [API] Implement MTA GTFS Static Data Parser
**Priority**: High  
**Complexity**: Medium  
**Skills Required**: Node.js, GTFS data formats, Data parsing

**Description**: Create service to parse and query MTA static GTFS data for station coordinates, routes, and stop sequences.

**Acceptance Criteria**:
- Service can download/parse GTFS static data from MTA
- Functions to find nearest stations given lat/lng coordinates
- Route lookup by line code (1,2,3,4,5,6,7,N,Q,R,W,B,D,F,M,A,C,E,G,J,Z,L)
- Stop sequence data for calculating train direction
- In-memory caching to avoid repeated parsing
- Error handling for malformed or unavailable GTFS data

**Dependencies**: API-001  
**Definition of Done**: Service returns correct nearest stations for test coordinates

---

#### [API] Integrate MTA GTFS-RT API Client  
**Priority**: High  
**Complexity**: Medium  
**Skills Required**: REST APIs, Protocol Buffers, Real-time data

**Description**: Build client to fetch and parse real-time train position data from MTA GTFS-RT feeds.

**Acceptance Criteria**:
- HTTP client for MTA GTFS-RT API with proper authentication
- Protocol buffer parsing for vehicle positions and trip updates
- Functions to get current trains near specific stations
- Real-time arrival prediction data extraction
- Rate limiting and error handling for API calls
- Configurable API key via environment variables

**Dependencies**: API-001, API-007  
**Definition of Done**: Client successfully fetches live train data from MTA

---

#### [API] Develop Train Identification Algorithm
**Priority**: High  
**Complexity**: High  
**Skills Required**: Algorithms, Geospatial calculations, Data analysis

**Description**: Implement core logic to match user location with specific train based on real-time position data.

**Acceptance Criteria**:
- Algorithm takes user lat/lng + line code as input
- Matches user position to most likely train based on:
  - Proximity to train's current position
  - Train direction and timing
  - Station sequence alignment
- Handles edge cases (between stations, multiple trains, etc.)
- Returns confidence score with train identification
- Performance optimized for < 5 second response time
- Comprehensive unit tests for various scenarios

**Dependencies**: API-002, API-003  
**Definition of Done**: Algorithm correctly identifies test trains with >80% accuracy

---

#### [API] Implement API Request/Response Handling
**Priority**: Medium  
**Complexity**: Low  
**Skills Required**: HTTP APIs, JSON, Input validation

**Description**: Create HTTP request handler that validates input and formats responses according to API specification.

**Acceptance Criteria**:
- Validates POST request body for latitude, longitude, line_code
- Input sanitization and type checking
- Structured JSON response matching ERD specification
- Proper HTTP status codes for success/error cases
- Request logging for debugging and monitoring
- CORS headers for web client compatibility

**Dependencies**: API-001, INFRA-005 (shared types)  
**Definition of Done**: API accepts valid requests and returns properly formatted responses

---

#### [API] Add Error Handling and Edge Cases
**Priority**: Medium  
**Complexity**: Medium  
**Skills Required**: Error handling, Logging, System resilience

**Description**: Implement comprehensive error handling for all failure scenarios outlined in PRD.

**Acceptance Criteria**:
- Graceful handling of MTA API unavailability
- User-friendly error messages for invalid locations
- Fallback responses when no trains are detected
- Service alert integration when lines are not running
- Timeout handling for long-running requests
- Structured error logging for troubleshooting
- Error responses match shared TypeScript interfaces

**Dependencies**: API-004, API-005  
**Definition of Done**: API handles all identified edge cases without crashing

---

#### [API] Setup AWS Parameter Store for API Keys
**Priority**: Low  
**Complexity**: Low  
**Skills Required**: AWS Parameter Store, IAM, Security

**Description**: Configure secure storage and retrieval of MTA API keys using AWS Systems Manager Parameter Store.

**Acceptance Criteria**:
- MTA API key stored as SecureString in Parameter Store
- Lambda IAM role has permission to read parameter
- Runtime function to fetch API key during Lambda execution
- Environment-specific parameter names (dev/staging/prod)
- Error handling when parameter is unavailable
- Documentation for updating API keys

**Dependencies**: INFRA-003  
**Definition of Done**: Lambda function can securely retrieve MTA API key at runtime

---

### Frontend Application Development Tickets

#### [UI] Setup Expo Project with TypeScript
**Priority**: High  
**Complexity**: Low  
**Skills Required**: Expo, React Native, TypeScript

**Description**: Initialize Expo application with TypeScript configuration and basic navigation structure.

**Acceptance Criteria**:
- Expo project created in `apps/mobile/` with TypeScript template
- Navigation structure using React Navigation
- Basic screens: Home, Train Results, Error
- Expo configuration for web and mobile builds
- Integration with shared TypeScript types package
- Development server runs on port 19006 for web

**Dependencies**: INFRA-001, INFRA-002  
**Definition of Done**: Expo app loads successfully in browser and mobile simulator

---

#### [UI] Implement Geolocation Service
**Priority**: High  
**Complexity**: Medium  
**Skills Required**: Geolocation API, React Native, Permission handling

**Description**: Create service to handle user location detection with fallback options.

**Acceptance Criteria**:
- Request user permission for location access
- Get current position with appropriate accuracy settings
- Handle permission denied scenario gracefully
- Location accuracy validation (reject if too imprecise)
- Loading states during location detection
- Error messages for location failures
- Mock location support for development/testing

**Dependencies**: UI-001  
**Definition of Done**: App successfully gets user location or shows appropriate fallback

---

#### [UI] Create Train Line Selection Component
**Priority**: High  
**Complexity**: Low  
**Skills Required**: React Native, UI components, Design systems

**Description**: Build dropdown/picker component for users to select their MTA train line.

**Acceptance Criteria**:
- Dropdown with all MTA lines (1,2,3,4,5,6,7,N,Q,R,W,B,D,F,M,A,C,E,G,J,Z,L)
- Visual design matching MTA line colors and branding
- Search/filter functionality for quick line selection
- Mobile-optimized picker for native apps
- Keyboard navigation support for web
- Selected line state management

**Dependencies**: UI-001  
**Definition of Done**: Users can select any MTA line with appropriate visual feedback

---

#### [UI] Develop Train Results Display Component
**Priority**: High  
**Complexity**: Medium  
**Skills Required**: React Native, Data visualization, UI/UX

**Description**: Create component to display identified train information and upcoming stop arrivals.

**Acceptance Criteria**:
- Train identification display (line, direction, service type)
- Next 3 stops with estimated arrival times
- Visual indicators for express/local service
- Real-time timestamp of last data update
- Loading animations during API calls
- Error states for failed identifications
- Responsive design for web and mobile

**Dependencies**: UI-001, INFRA-005 (shared types)  
**Definition of Done**: Component displays mock train data with proper formatting

---

#### [UI] Implement API Client for Backend Integration
**Priority**: Medium  
**Complexity**: Low  
**Skills Required**: HTTP clients, Async JavaScript, Error handling

**Description**: Create service to communicate with Lambda function API endpoint.

**Acceptance Criteria**:
- HTTP client configured for Lambda API endpoint
- Function to call `/api/identify-train` with location and line data
- Request/response type safety using shared interfaces
- Timeout handling for slow network connections
- Retry logic for transient failures
- Request cancellation when user navigates away
- Environment-specific API URLs (dev/prod)

**Dependencies**: UI-001, API-005, INFRA-005  
**Definition of Done**: Client successfully calls API and handles responses

---

#### [UI] Add Loading States and Error Handling
**Priority**: Medium  
**Complexity**: Low  
**Skills Required**: React Native, State management, User experience

**Description**: Implement comprehensive loading and error states throughout the application.

**Acceptance Criteria**:
- Loading spinners during location detection and API calls
- Progress indicators showing current step in train identification
- User-friendly error messages for all failure scenarios
- Retry buttons for recoverable errors
- Offline detection and appropriate messaging
- Error boundary components to catch unexpected crashes
- Analytics/logging for error tracking

**Dependencies**: UI-002, UI-005  
**Definition of Done**: App gracefully handles all error scenarios without crashes

---

#### [UI] Style Application with MTA Design System
**Priority**: Low  
**Complexity**: Medium  
**Skills Required**: UI design, CSS/Styling, Brand guidelines

**Description**: Apply consistent visual design following MTA branding and accessibility guidelines.

**Acceptance Criteria**:
- Color scheme matching official MTA brand guidelines
- Typography using system fonts with proper sizing
- Consistent spacing and component styling
- Accessibility compliance (contrast ratios, screen readers)
- Responsive layout for different screen sizes
- Loading animations and micro-interactions
- Dark mode support (bonus)

**Dependencies**: UI-003, UI-004  
**Definition of Done**: App has polished, professional appearance matching MTA aesthetic

---

#### [UI] Implement Manual Station Selection Fallback
**Priority**: Low  
**Complexity**: Low  
**Skills Required**: React Native, Search interfaces, Data filtering

**Description**: Add manual station selection when GPS location is unavailable or inaccurate.

**Acceptance Criteria**:
- Searchable list of all MTA stations
- Stations filtered by selected train line
- Autocomplete functionality for quick station finding
- Recent stations list for frequent users
- Integration with existing train identification flow
- Clear user guidance on when to use manual selection

**Dependencies**: UI-002, UI-003  
**Definition of Done**: Users can manually select station and proceed with train identification

---

### Integration & Testing Tickets

#### [TEST] Write Unit Tests for Lambda Function
**Priority**: Medium  
**Complexity**: Low  
**Skills Required**: Jest, Unit testing, Mocking

**Description**: Create comprehensive unit test suite for all Lambda function components.

**Acceptance Criteria**:
- Unit tests for train identification algorithm
- Mocked tests for MTA API integration
- Edge case testing for error handling
- Performance tests ensuring < 5 second response times
- Test coverage > 80% for all core functions
- Automated test running in CI/CD pipeline

**Dependencies**: API-004, API-006  
**Definition of Done**: All tests pass and maintain high code coverage

---

#### [TEST] Write Component Tests for Expo App
**Priority**: Medium  
**Complexity**: Low  
**Skills Required**: Jest, React Native Testing Library, Component testing

**Description**: Create unit and integration tests for React Native components.

**Acceptance Criteria**:
- Component rendering tests for all UI components
- User interaction testing (button clicks, form inputs)
- Navigation flow testing
- API client mocking and testing
- Accessibility testing for screen readers
- Snapshot tests for UI regression detection

**Dependencies**: UI-006  
**Definition of Done**: Component tests pass and prevent UI regressions

---

#### [TEST] Implement End-to-End Integration Tests
**Priority**: High  
**Complexity**: Medium  
**Skills Required**: E2E testing, API testing, Integration testing

**Description**: Create end-to-end tests validating complete user workflows.

**Acceptance Criteria**:
- Complete user journey from location input to train results
- API integration testing with real MTA data
- Cross-browser testing for web version
- Mobile device testing on iOS/Android simulators
- Performance testing under various network conditions
- Error scenario testing (no GPS, API failures, etc.)

**Dependencies**: UI-005, API-005  
**Definition of Done**: E2E tests validate complete application functionality

---

#### [TEST] Performance Testing and Optimization
**Priority**: Medium  
**Complexity**: Medium  
**Skills Required**: Performance testing, Optimization, Monitoring

**Description**: Validate and optimize application performance against PRD requirements.

**Acceptance Criteria**:
- Initial load time < 3 seconds verified
- Train identification < 5 seconds verified
- Memory usage profiling for Lambda function
- Bundle size optimization for Expo web
- Database query optimization (if applicable)
- Performance monitoring and alerting setup

**Dependencies**: TEST-003  
**Definition of Done**: Application meets all performance requirements

---

### Deployment Tickets

#### [DEPLOY] Deploy Lambda Function to AWS Production
**Priority**: High  
**Complexity**: Low  
**Skills Required**: AWS SAM, Lambda deployment, Environment management

**Description**: Deploy the completed Lambda function to AWS production environment.

**Acceptance Criteria**:
- Production deployment using SAM template
- Environment variables properly configured
- API Gateway endpoint functional and accessible
- CloudWatch logging and monitoring active
- Production MTA API keys configured
- Health check endpoint responding

**Dependencies**: API-006, INFRA-003  
**Definition of Done**: Lambda function is live and responding to production traffic

---

#### [DEPLOY] Deploy Expo Web App to S3/CloudFront
**Priority**: High  
**Complexity**: Medium  
**Skills Required**: Expo build, AWS S3, CloudFront, Web deployment

**Description**: Build and deploy Expo web application to AWS hosting infrastructure.

**Acceptance Criteria**:
- Expo web build optimized for production
- Static assets deployed to S3 bucket
- CloudFront distribution configured for global CDN
- Custom domain and SSL certificate configured
- Environment variables set for production API endpoint
- Cache invalidation strategy implemented

**Dependencies**: UI-007, INFRA-003  
**Definition of Done**: Web application is accessible via production URL

---

#### [DEPLOY] Configure Production Monitoring
**Priority**: Medium  
**Complexity**: Low  
**Skills Required**: CloudWatch, Monitoring, Alerting

**Description**: Set up comprehensive monitoring and alerting for production systems.

**Acceptance Criteria**:
- CloudWatch dashboards for Lambda metrics
- Error rate and latency alarms configured
- Log aggregation and search functionality
- API Gateway request/response monitoring
- Cost monitoring and budget alerts
- Notification channels for critical issues

**Dependencies**: DEPLOY-001, DEPLOY-002  
**Definition of Done**: Production monitoring provides visibility into system health

---

#### [QA] User Acceptance Testing with Real MTA Data
**Priority**: High  
**Complexity**: Medium  
**Skills Required**: Manual testing, User experience, MTA system knowledge

**Description**: Conduct thorough user acceptance testing using real MTA data and scenarios.

**Acceptance Criteria**:
- Test train identification accuracy across different lines
- Validate arrival time predictions against actual arrivals
- Test during various times of day and service conditions
- Verify handling of service disruptions and delays
- Cross-platform testing (web, iOS, Android)
- User feedback collection and issue documentation

**Dependencies**: DEPLOY-001, DEPLOY-002  
**Definition of Done**: Application achieves 80% accuracy target in real-world testing

---

## Dependency Graph

### Critical Path
1. **INFRA-001** → **INFRA-002** → **API-001** → **API-002** → **API-003** → **API-004** → **TEST-003** → **DEPLOY-001**
2. **INFRA-001** → **UI-001** → **UI-002** → **UI-005** → **TEST-003** → **DEPLOY-002**

### Parallel Development Opportunities
- **Infrastructure Setup**: INFRA-003, INFRA-004, INFRA-005 can be developed simultaneously
- **Backend Development**: API-002 and API-007 can be developed in parallel after API-001
- **Frontend Components**: UI-002, UI-003 can be developed simultaneously after UI-001
- **Testing**: TEST-001 and TEST-002 can be developed in parallel
- **Deployment**: DEPLOY-001 and DEPLOY-002 can happen simultaneously

### Potential Bottlenecks
- **API-004 (Train Identification Algorithm)**: Highest complexity, blocks integration testing
- **INFRA-002 (Docker Environment)**: Blocks local development for both frontend and backend
- **TEST-003 (Integration Tests)**: Requires both frontend and backend completion

---

## Risk Assessment

### Technical Risks
1. **MTA API Reliability**: Real-time data may be inconsistent or unavailable
   - *Mitigation*: Implement robust error handling and fallback responses
   
2. **Train Identification Accuracy**: Algorithm may struggle with complex scenarios
   - *Mitigation*: Extensive testing with real data, iterative algorithm improvement
   
3. **Geolocation Precision**: GPS accuracy varies significantly underground
   - *Mitigation*: Manual station selection fallback, location validation

4. **Docker Environment Complexity**: Multi-service development environment setup
   - *Mitigation*: Detailed documentation, containerized consistency

### Resource Constraints
1. **MTA API Rate Limits**: Production usage may hit API throttling
   - *Mitigation*: Implement caching, request queuing, monitor usage

2. **AWS Lambda Cold Starts**: Initial request latency may exceed targets
   - *Mitigation*: Provisioned concurrency for production, performance monitoring

### External Dependencies
1. **MTA Data Quality**: Accuracy depends on MTA's real-time feed quality
   - *Mitigation*: Cannot be fully controlled, implement data validation

2. **Browser Geolocation Permissions**: Users may deny location access
   - *Mitigation*: Clear permission requests, manual selection fallback

---

## Notes for Development Team

### Getting Started
1. Begin with Milestone 1 to establish foundation
2. Ensure Docker environment is working before proceeding to development
3. Set up MTA Developer API access early in the process

### Code Quality Standards
- Maintain >80% test coverage across all packages
- Use shared TypeScript interfaces to prevent API contract drift
- Follow ESLint/Prettier configurations for consistent code style
- Implement comprehensive error handling and logging

### Performance Considerations
- Monitor Lambda function memory usage and adjust as needed
- Optimize Expo web bundle size for fast initial load
- Implement request caching where appropriate
- Consider pagination for large result sets (future feature)
# MVP Train Tracking - Product Requirements Document

## Feature Overview
Launch the minimum viable product for "What Train Am I On?" - a web application that identifies the specific MTA train a user is currently on and provides real-time arrival estimates for upcoming stops.

## User Stories

### Primary User Story
**As a** NYC subway rider  
**I want to** input my location and train line  
**So that** I can identify which specific train I'm on and see when I'll reach upcoming stops

### Acceptance Criteria
- User can select their current train line from MTA options
- User location is automatically detected or manually inputted
- System identifies the specific train at user's location
- System displays next 3 upcoming stops with ETAs
- Results display within 5 seconds of input

## Functional Requirements

### Core Features
1. **Location Input**
   - GPS-based automatic location detection (client-side)
   - Manual station selection fallback
   - Location accuracy validation

2. **Train Line Selection**
   - Dropdown/picker with all MTA lines (1,2,3,4,5,6,7,N,Q,R,W,B,D,F,M,A,C,E,G,J,Z,L)
   - Visual line identifiers (colors/symbols)

3. **Train Identification**
   - Single API call with location + line code
   - Server queries MTA real-time feeds
   - Returns specific train match based on current position

4. **Arrival Predictions**
   - Display next 3 stops with estimated arrival times
   - Show train direction and service type (express/local)
   - Fresh data on each request (no persistent updates)

## Technical Requirements

### Data Sources
- MTA GTFS-RT feeds for real-time train positions (via MTA Developer API)
- MTA static GTFS data for station/route information
- Client-side geolocation API for user positioning

### Performance
- Initial load time: < 3 seconds
- Train identification: < 5 seconds
- Stateless API calls - no persistent sessions

### Technology Stack
- **Frontend**: Expo with TypeScript (web + native mobile apps)
- **Backend**: AWS Lambda with Node.js/TypeScript
- **Deployment**: AWS (Lambda + API Gateway + S3 + CloudFront)
- **CI/CD**: GitHub Actions
- **Shared Types**: TypeScript interfaces across frontend/backend

## API Requirements
- **Single Lambda Function**: `POST /api/identify-train`
  - Input: `{ "latitude": number, "longitude": number, "line_code": string }`
  - Output: `{ "train_id": string, "direction": string, "next_stops": [...] }`
- No user authentication required
- MTA API key stored in AWS Systems Manager Parameter Store
- Stateless serverless architecture

## Success Metrics
- **Primary**: 80% accurate train identification within 30 seconds
- **Secondary**: < 5 second average response time
- **User Experience**: 70% user task completion rate
- **Engagement**: 60% return usage within 7 days

## Dependencies
- MTA Developer API access and keys
- Real-time GTFS-RT feed availability
- Station coordinate data accuracy
- Browser geolocation permissions

## Edge Cases & Error Handling
- No GPS signal/permission denied → Manual station selection
- Multiple trains at station → Present options with timestamps
- No trains currently running → Display service alerts
- API unavailable → Cached data with staleness indicator
- User between stations → Show nearest upcoming station

## Architecture Considerations
- **Monorepo Structure**: Expo app + Lambda function + shared types
- **AWS SAM**: Infrastructure as code for Lambda deployment
- **GitHub Actions**: Automated testing and deployment pipeline
- **Cross-platform**: Single Expo codebase for web/iOS/Android
- **Serverless**: No server management, auto-scaling Lambda functions

## Out of Scope (Future Features)
- Native iOS/Android applications (Phase 2)
- Multi-city transit systems
- Push notifications for delays
- Trip planning between destinations
- Offline functionality
- User accounts or authentication
- Data persistence or user sessions
- Historical trip data

## Success Criteria
- Users can successfully identify their train 80% of the time
- App loads and responds within performance targets
- Clean, intuitive interface requiring no tutorial
- Accurate real-time data integration with MTA feeds
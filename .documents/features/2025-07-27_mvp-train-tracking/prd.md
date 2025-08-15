# MVP Train Tracking - Product Requirements Document

## Feature Overview
Launch the minimum viable product for "What Train Am I On?" - a web application that identifies the specific MTA train a user is currently on and provides real-time arrival estimates for upcoming stops.

## User Stories

### Primary User Story
**As a** NYC subway rider  
**I want to** navigate through a multi-step flow to select my train line and direction  
**So that** I can identify which specific train I'm on and see when I'll reach upcoming stops

### Secondary User Stories

**As a** NYC subway rider  
**I want to** select my train line from visual cards instead of a dropdown  
**So that** I can quickly identify my line using familiar MTA colors and designs

**As a** NYC subway rider  
**I want to** specify my train's direction or skip direction selection  
**So that** I can get more accurate results when I know my direction or still get help when uncertain

**As a** NYC subway rider  
**I want to** navigate back to previous selection steps  
**So that** I can correct my choices without starting over

### Acceptance Criteria
- User can select their train line from visual cards displaying official MTA colors
- User can search or filter train lines for quick selection
- User can select train direction with clear terminal station names
- User can skip direction selection if uncertain
- User can navigate back to previous selection pages
- User location is automatically detected or manually inputted
- System identifies the specific train at user's location with or without direction
- System displays next 3 upcoming stops with ETAs
- Results display within 5 seconds of final selection

## Functional Requirements

### Core Features
1. **Train Selection Page**
   - Display all MTA lines as selectable cards/buttons (1,2,3,4,5,6,7,N,Q,R,W,B,D,F,M,A,C,E,G,J,Z,L)
   - Cards show official MTA colors and line identifiers
   - Search/filter functionality for quick line discovery
   - Touch-optimized interface for mobile devices
   - Navigation to direction selection page upon train selection
   - State management to preserve selected train line

2. **Direction Selection Page**
   - Display available directions for selected train line (e.g., Uptown/Downtown)
   - Show terminal station names for clarity (e.g., "Uptown to 125th St")
   - "Skip" option for users uncertain about direction
   - Back navigation button to return to train selection
   - Proceed to train identification with or without direction selection
   - State management to preserve direction choice

3. **Navigation & State Management**
   - React Navigation stack for multi-page flow
   - Persistent state management across pages
   - Breadcrumb or progress indicator showing current step
   - Smooth transitions between selection pages
   - Handle browser back button appropriately

4. **Location Input**
   - GPS-based automatic location detection (client-side)
   - Manual station selection fallback
   - Location accuracy validation

5. **Train Identification**
   - API call with location + line code + optional direction
   - Server queries MTA real-time feeds
   - Enhanced logic to handle direction skip scenarios
   - Returns specific train match based on current position

6. **Arrival Predictions**
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
- **Backend**: Express.js with Node.js/TypeScript
- **Deployment**: Docker containers + static hosting (Netlify/Vercel for web)
- **CI/CD**: GitHub Actions
- **Shared Types**: TypeScript interfaces across frontend/backend

## API Requirements
- **Express API Endpoint**: `POST /api/identify-train`
  - Input: `{ "latitude": number, "longitude": number, "line_code": string, "direction"?: string }`
  - Output: `{ "train_id": string, "direction": string, "next_stops": [...] }`
  - Enhanced logic to handle optional direction parameter
- No user authentication required
- MTA API key stored in environment variables
- Stateless Express.js architecture

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
- User navigates back during flow → Preserve previous selections
- User refreshes page mid-flow → Restart selection process
- Direction skipped but required for accuracy → Algorithm handles ambiguous cases
- No service in selected direction → Display appropriate messaging

## Architecture Considerations
- **Monorepo Structure**: Expo app + Express API + shared types
- **Docker**: Containerized development and deployment
- **GitHub Actions**: Automated testing and deployment pipeline
- **Cross-platform**: Single Expo codebase for web/iOS/Android
- **Express.js**: Simple HTTP server with standard Node.js patterns

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
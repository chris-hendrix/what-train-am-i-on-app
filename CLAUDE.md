# What Train Am I On? - Claude Code Project Context

## Project Overview
An MTA-focused mobile/web application that identifies the exact train a user is currently on and provides real-time arrival estimates for upcoming stops.

## Core Features
- **Input**: User location + train line selection
- **Output**: Specific train identification + next stop ETAs
- **Scope**: NYC MTA subway system initially

## Architecture Notes
- RESTful API backend for MTA data integration
- Mobile-first responsive web design
- Real-time data processing for train positions
- Location-based services for user positioning

## Development Context
- **Target Users**: NYC transit riders needing precise train information
- **Key Challenge**: Differentiating between express/local trains on same line
- **Success Metric**: Accurate train identification within 30 seconds

## Documentation Structure
All feature documentation lives in `.documents/features/YYYY-MM-DD_feature-name/`:
- `erd.md` - Database design
- `prd.md` - Product requirements  
- `ticket-plan.md` - Development tickets

## Available Subagents
- **prd-maker**: Specialized agent for creating comprehensive PRDs
  - Usage: `@prd-maker create PRD for [feature description]`
  - Context-aware of app purpose and documentation structure

## External Dependencies
- MTA real-time feeds (GTFS-RT)
- Geolocation services
- Map/station data APIs

## Development Commands
*To be populated as project grows*

## Testing Strategy
*To be defined with first implementation*
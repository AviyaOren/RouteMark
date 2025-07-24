# POI Management System

## Overview

This is a web-based tool for logistics coordinators to mark and manage Points of Interest (POIs) relevant to field riders. The application allows users to create, edit, and manage POIs such as restrooms, water fountains, food stops, fuel stations, and meeting points on an interactive map interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack TypeScript architecture with a clear separation between client and server code:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Map Integration**: Leaflet.js for interactive mapping functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the stack
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with proper error handling

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC integration
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Roles**: Three-tier permission system (Admin, Editor, Viewer)
- **Authorization**: Role-based access control for POI operations

### POI Management
- **CRUD Operations**: Full create, read, update, delete functionality
- **Categories**: Five predefined POI types (Restroom, Water Fountain, Food Stop, Fuel Station, Meeting Point)
- **Geolocation**: Precise latitude/longitude storage with decimal precision
- **Metadata**: Name, description, creator tracking, and timestamps

### Map Interface
- **Library**: Leaflet.js with dynamic imports for SSR compatibility
- **Interaction**: Click-to-add POI functionality
- **Filtering**: Category-based filtering with visual indicators
- **Markers**: Custom markers with category-specific styling

### User Interface
- **Design System**: Consistent component library with Shadcn/ui
- **Responsive**: Mobile-first design with adaptive layouts
- **Accessibility**: ARIA-compliant components from Radix UI
- **Theming**: Light/dark mode support via CSS variables

## Data Flow

1. **Authentication Flow**:
   - User initiates login via Replit Auth
   - OIDC provider validates credentials
   - Session created and stored in PostgreSQL
   - User permissions loaded based on role

2. **POI Management Flow**:
   - Map click captures coordinates
   - Modal form collects POI details
   - Client validates data with Zod schemas
   - Server performs authorization check
   - Database operation via Drizzle ORM
   - UI updates via React Query cache invalidation

3. **Map Rendering Flow**:
   - POIs fetched from API on component mount
   - Data filtered based on category selection
   - Leaflet markers created and positioned
   - Interactive popups show POI details

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **leaflet**: Interactive mapping functionality
- **express**: Web server framework
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing

### Development Dependencies
- **typescript**: Type safety throughout
- **vite**: Fast build tooling
- **tsx**: TypeScript execution for server

## Deployment Strategy

### Development Environment
- **Server**: tsx with hot reloading via NODE_ENV=development
- **Client**: Vite dev server with HMR
- **Database**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth integration

### Production Build
- **Client**: Vite build to dist/public
- **Server**: esbuild bundle to dist/index.js
- **Deployment**: Single Node.js process serving both API and static files
- **Database**: Production Neon database via DATABASE_URL

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **REPL_ID**: Replit environment identifier
- **ISSUER_URL**: OIDC provider URL for authentication

The architecture prioritizes type safety, developer experience, and maintainability while providing a robust foundation for the POI management functionality.
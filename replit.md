# FairDealHub 2.0 - Modern Affiliate Deals Platform

## Overview

FairDealHub 2.0 is a modern affiliate discounts platform that connects users with verified coupon codes and exclusive deals from top brands. The application features a futuristic dark theme with neon accents, glassmorphism UI effects, and AI-powered personalization to deliver the best shopping deals to users. It includes a comprehensive admin panel for managing affiliate networks, products, coupons, and automated deal generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing with authentication-based conditional rendering
- **State Management**: TanStack Query (React Query) for server state management, caching, and synchronization
- **UI Framework**: shadcn/ui components built on Radix UI primitives providing accessible, customizable components
- **Styling**: Tailwind CSS with custom CSS variables for theming, featuring dark base colors with neon accents (mint #38F8B3, purple #7C4DFF, pink #FF5AF1)
- **Design System**: Glassmorphism effects, subtle gradients, micro-interactions, and spring animations for modern UX
- **Typography**: Space Grotesk for headings, Inter for body text, providing geometric and humanist font pairing

### Backend Architecture
- **Runtime**: Node.js with Express.js server providing REST API endpoints
- **Development Setup**: Vite middleware integration for hot module reloading and seamless full-stack development
- **API Structure**: RESTful endpoints organized by feature (auth, admin, products, analytics, etc.)
- **Build Process**: ESBuild for production server bundling, Vite for client asset optimization
- **Session Management**: Express sessions with PostgreSQL session store for scalable session handling

### Authentication System
- **Provider**: Replit Auth integration using OpenID Connect for seamless authentication
- **Session Storage**: HTTP-only cookies with secure session configuration and CSRF protection
- **Authorization**: Role-based access control with user, admin, and editor roles
- **User Management**: Mandatory users and sessions tables for Replit Auth compatibility

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Provider**: Neon Database (serverless PostgreSQL) with connection pooling via @neondatabase/serverless
- **Schema Design**: Comprehensive tables for users, categories, merchants, affiliate networks, products, coupons, subscribers, email campaigns, sales funnels, clickout tracking, and analytics metrics
- **Relationships**: Proper foreign key relationships with indexing for optimal query performance
- **Migrations**: Drizzle Kit for schema management and database migrations

### AI & Automation Services
- **AI Generator**: Automated product discovery and content generation using OpenAI GPT-4
- **Content Creation**: AI-powered product categorization, description enhancement, and coupon generation
- **Scheduled Jobs**: Automated deal discovery and product updates every 4 hours
- **Quality Control**: AI-based filtering for product quality, ratings, and relevance

### Email Marketing System
- **Service Integration**: Resend API for transactional and marketing emails with React Email templates
- **Personalization**: AI-driven personalized deal recommendations based on user preferences and behavior
- **Campaign Management**: Email campaigns, sales funnels, and subscriber management
- **Analytics**: Email open rates, click tracking, and conversion monitoring

### Analytics & Tracking
- **Performance Metrics**: Real-time dashboard with page views, clickouts, conversions, and revenue tracking
- **User Behavior**: Clickout tracking for affiliate link performance and conversion attribution
- **Business Intelligence**: Top products, merchants, and category performance analytics
- **Conversion Optimization**: A/B testing capabilities and funnel analysis

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL database with automatic scaling and connection pooling
- **Replit Auth**: OpenID Connect authentication provider with user management and session handling
- **OpenAI API**: GPT-4 integration for AI-powered content generation and product categorization
- **Resend**: Email delivery service for transactional emails and marketing campaigns

### Affiliate Networks Integration
- **Target Networks**: CJ (Commission Junction), Impact.com, Awin, ShareASale, Rakuten Advertising for product feeds and commission tracking
- **API Integration**: Automated product syndication and commission tracking across multiple affiliate networks
- **Deal Discovery**: Real-time product feed processing and deal validation

### Development & Deployment
- **Vite**: Build tool and development server with React plugin and runtime error overlay
- **Replit Deployment**: Native Replit hosting with cartographer plugin for enhanced development experience
- **TypeScript**: Type safety across frontend, backend, and shared schemas

### UI & Design Libraries
- **Radix UI**: Headless accessible components for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Consistent icon library for UI elements
- **React Hook Form**: Form validation and state management
- **date-fns**: Date manipulation and formatting utilities

### Security & Monitoring
- **Session Security**: Secure HTTP-only cookies with CSRF protection
- **Data Validation**: Zod schemas for runtime type checking and API validation
- **Error Handling**: Structured error logging and user-friendly error messages
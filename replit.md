# Overview

This is a full-stack prompt engineering application suite with two main components:

1. **Prompt Builder**: Allows users to build, test, and manage AI prompts with the Anthropic Claude API. Provides a visual interface for constructing prompts, configuring API parameters, executing prompts, and viewing results with cost tracking and token usage metrics.

2. **File Processing Workspace**: Independent file-to-JSON conversion system that enables users to upload various file types (PDF, DOCX, TXT, MD, CSV, JSON, XML), configure conversion options, and generate optimized JSON output for use in prompts. Includes token estimation and cost analysis.

The system is designed as an integrated prompt engineering suite, enabling users to convert documents into AI-ready formats and seamlessly build prompts with intelligent content processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system and Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Drag & Drop**: @hello-pangea/dnd for reorderable message lists
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON request/response format
- **Development Server**: Vite development middleware integration for hot reloading
- **Error Handling**: Centralized error middleware with structured error responses

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL database
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Fallback Storage**: In-memory storage implementation for development/testing

## Database Schema
The application uses multiple entities:

### Prompt Builder
- **Prompt Templates**: Stores reusable prompt configurations with system prompts, messages, and parameters
- **Prompt Executions**: Records execution history with input/output tokens, costs, and response data

### File Processing
- **Uploaded Files**: Tracks file uploads with metadata (name, type, size, status, session)
- **File Conversions**: Stores conversion results with JSON output, token counts, and processing options
- **Users**: Basic user management for authentication (when needed)

## External Dependencies

### AI Service Integration
- **Anthropic Claude API**: Primary AI service for prompt execution
- **Model Support**: Claude Sonnet 4 (claude-sonnet-4-20250514) as the default model
- **Features**: Support for text messages, system prompts, and advanced parameters like thinking mode

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and migrations
- **Environment Variables**: DATABASE_URL and ANTHROPIC_API_KEY configuration

### File Processing & Upload
- **Multer**: File upload middleware for handling multipart/form-data
- **CSV Parser**: Processing CSV files for data extraction
- **Express Session**: Session management for file tracking across requests
- **File Processing Service**: Comprehensive file analysis and JSON conversion

### Development Tools
- **Replit Integration**: Development environment with cartographer plugin and runtime error overlay
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **ESBuild**: Production build bundling for server code

### UI Components & Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Inter, JetBrains Mono, and other typography options

## Recent Changes

### File Processing Integration (January 2025)
- Added independent file processing workspace with separate navigation
- Implemented file upload system supporting 7 file types (PDF, DOCX, TXT, MD, CSV, JSON, XML)
- Built conversion engine with three modes: summary, full content, metadata only
- Added token estimation and cost calculation for processed content
- Created comprehensive UI for file management, conversion options, and JSON output viewing
- Integrated session-based file tracking for multi-file workflows

The architecture emphasizes type safety, developer experience, and scalability with a clear separation between client and server code while sharing type definitions through a common schema layer. The dual-workspace design allows users to seamlessly move between document processing and prompt building workflows.
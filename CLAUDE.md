# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production (creates `/out` directory for static export)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Authentication
All user accounts use password: `study`
- Username: `demo` (Demo User)
- Username: `admin` (Admin)

## Architecture Overview

### Core Application Structure
This is a **Next.js 15** application using the **App Router** architecture with four distinct narrative visualization scenarios for user studies. The application compares different approaches to data storytelling.

### Key Architectural Patterns

**Scenario-Based Architecture**: The app is organized around four scenario types:
- `pure-text` - Text-only narrative view
- `text-visual` - Text with interactive visualizations
- `text-chat` - Text with AI chat assistance
- `mixed` - Combined visualizations and AI chat

**State Management Strategy**:
- **Zustand** for global application state
- **React Context** for feature-specific state (auth, tooltips, control panels)
- **localStorage** for session persistence

**Component Architecture**:
- Feature-based organization in `src/components/features/`
- Shared UI components in `src/components/ui/`
- Context providers for cross-cutting concerns

### Data Structure
The application works with narrative data from `public/data.json` containing:
- Events with temporal anchoring (real time vs narrative time)
- Entities with social roles (Groups, Governments, Objects/Places/Agreements)
- Sentiment analysis (polarity, intensity)
- Topic classification with sub-topics

### Visualization Components
- **D3.js** for data transformations and calculations
- Custom React components for rendering visualizations
- Entity relationship mapping and sentiment visualization
- Interactive graph components for narrative exploration

### Authentication System
- Mock authentication with persistent localStorage sessions
- Role-based access (currently all users have "domain" role)
- Session management through React Context

### API Integration
- OpenAI API integration for chat functionality (requires `OPENAI_API_KEY`)
- RESTful API routes in `src/app/api/`
- 20 message limit per session for cost management

### Route Structure
- `src/app/(scenarios)/` - Protected scenario routes
- Middleware handles route protection and authentication
- Direct scenario access allowed (no dashboard redirect required)

## Environment Variables
- `OPENAI_API_KEY` - Required for AI chat functionality (create `.env.local` for local development)

## Key Files to Understand
- `src/types/scenario.ts` - Central scenario type definitions
- `src/contexts/auth-context.tsx` - Authentication logic and session management
- `src/middleware.ts` - Route protection and request handling
- `public/data.json` - Narrative data structure and content
- `src/app/(scenarios)/` - Main scenario implementations

## Styling System
- **Tailwind CSS** with custom design system
- CSS custom properties for theming (HSL color system)
- Radix UI for accessible, unstyled components
- Custom keyframe animations for accordions

## GitHub Actions
- Automated deployment to GitHub Pages
- Builds static export on push to main branch
- Node.js 20 runtime environment
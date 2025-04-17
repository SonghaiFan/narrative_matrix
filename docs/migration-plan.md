# Scenario Route Migration Plan

## Overview

This document outlines the step-by-step migration plan to implement dynamic routes for scenarios using Next.js App Router while preserving existing components and functionality.

## Current Implementation Analysis

### Route Structure

- Multiple `/text-visual-X/` directories for scenario metadata
- Main scenario content in `/text-visual/`
- Training and introduction routes under `/text-visual/`
- No proper dynamic routes for individual scenarios

### State Management

- Uses multiple sources to determine current scenario:
  - URL query parameters
  - Center Control Context (`selectedScenario`)
  - URL path extraction
  - LocalStorage (`currentScenario`)
  - Auth Context
  - Hardcoded fallback (`text-visual-8`)

### Data Flow

- The `useScenarioData` hook in `src/contexts/use-scenario-data.ts` manages fetching and processing
- Client-side data loading in React components
- Client-side metadata processing for quizzes
- Static imports of all scenario metadata files

### Key Components to Preserve

- `VisualizationScenario` in `/components/features/visualization/`
- `ScenarioPageFactory` in `/components/features/dashboard/`
- Existing pages in `/app/completion/` and `/app/dashboard/`
- All components in `/components/features/`

## Phase 1: Route Setup

### Task 1.1: Create Dynamic Route Structure

- [ ] Create new directory structure:
  ```
  src/app/(scenarios)/text-visual/[id]/
  ```
- [ ] Keep empty directory until implementation
- [ ] Set up TypeScript interfaces for route params

### Task 1.2: Implement Basic Page Component

- [ ] Create `page.tsx` in new dynamic route directory
- [ ] Reuse `VisualizationScenario` component
- [ ] Implement route parameter extraction

### Task 1.3: Set Up Error and Loading Boundaries

- [ ] Create `error.tsx` component
- [ ] Create `loading.tsx` component
- [ ] Set up server component structure

## Phase 2: Data Layer

### Task 2.1: Server-Side Data Fetching

- [x] Create adapter for existing data fetching logic
- [x] Implement server-side fetch functions
- [x] Maintain compatibility with existing hooks

### Task 2.2: Static Path Generation

- [x] Implement `generateStaticParams` using existing scenario list
- [x] Create fallback handling for dynamic scenarios
- [x] Set up revalidation strategy

### Task 2.3: Metadata Generation

- [x] Create `generateMetadata` function
- [x] Reuse existing metadata from scenario files
- [x] Add dynamic OpenGraph data

## Phase 3: State Management

### Task 3.1: Preserve Existing Context

- [x] Keep `center-control-context.tsx` functionality
- [x] Create compatibility layer for new routing (`ScenarioContextSync`)
- [x] Add route synchronization logic (Implemented in `ScenarioContextSync`)

### Task 3.2: URL State Handling

- [x] Enhance URL state management (Server component reads params/searchParams)
- [x] Create bidirectional sync between URL and context (Handled by Task 3.1's ScenarioContextSync)
- [x] Maintain localStorage fallback for backward compatibility (No changes made to existing localStorage logic)

### Task 3.3: Navigation Enhancements

- [x] Update existing navigation to support new routes (`ScenarioSelector`)
- [x] Implement routes with proper params (Path param used)
- [x] Support deep linking (Enabled by dynamic routes)

## Phase 4: UI Components

### Task 4.1: Scenario Navigation

- [x] Enhance existing navigation with dynamic route support (Covered by Task 3.3)
- [x] Keep current UI/UX (No changes made)
- [x] Add route-aware active state handling (Handled by context sync and existing logic)

### Task 4.2: Loading States

- [x] Implement better loading states with Suspense (Using loading.tsx)
- [x] Keep existing loading UI (Skeleton loader in loading.tsx)
- [x] Add streaming support (Handled by Next.js App Router)

### Task 4.3: Error Boundaries

- [x] Set up error boundaries that work with server components (Using error.tsx)
- [x] Preserve existing error UI (error.tsx provides basic UI)
- [x] Add better error recovery (error.tsx includes reset function)

## Phase 5: Testing & Optimization

### Task 5.1: Testing

- [x] Test existing functionality with new routes (Manual tests successful for multiple scenarios, training mode, dashboard nav)
- [x] Verify backward compatibility (Client-side redirects implemented for old routes)
- [ ] Set up test for all scenarios (Automated tests pending)

## Phase 6: Cleanup (Renamed from Migration Steps Step 4)

### Task 6.1: Remove Old Routes

- [x] Remove `/text-visual/page.tsx`
- [x] Consider removing `/text-visual-X` metadata folders (Decision: Removed after hardcoding metadata)

### Task 6.2: Clean Up Unused/Redundant Code

- [x] Simplify scenario ID detection in `useScenarioData` hook
- [ ] Review `getScenarioFromPath` function for removal (Kept for now)
- [x] Review `CenterControlContext` for further simplification (No changes needed)
- [x] Refactored server metadata loading to use hardcoded map

### Task 6.3: Update Documentation

- [ ] Update README or other docs with new routing structure
- [ ] Finalize CHANGELOG.md

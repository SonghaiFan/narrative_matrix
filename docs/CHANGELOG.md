# Changelog

All notable changes to the Scenario Route Migration project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial migration plan
- Task tracking system
- Cursor rules for task management
- Completed task: Create Dynamic Route Structure
- Completed task: Implement Basic Page Component
- Completed task: Set Up Error and Loading Boundaries
- Completed task: Server-Side Data Fetching
- Completed task: Static Path Generation
- Completed task: Metadata Generation
- Completed task: Preserve Existing Context
- Completed task: URL State Handling
- Completed task: Navigation Enhancements
- Completed task: Scenario Navigation (Verification)
- Completed task: Loading States
- Completed task: Error Boundaries
- Initial manual testing successful for dynamic route
- Successful manual testing of multiple scenarios, training mode, and dashboard navigation
- Client-side redirects for backward compatibility of old routes

### Changed

- Updated migration plan with completed task: Create Dynamic Route Structure
- Updated migration plan with completed task: Implement Basic Page Component
- Updated migration plan with completed task: Set Up Error and Loading Boundaries
- Updated migration plan with completed task: Server-Side Data Fetching
- Updated migration plan with completed task: Static Path Generation
- Updated migration plan with completed task: Metadata Generation
- Updated migration plan with completed task: Preserve Existing Context
- Updated migration plan with completed task: URL State Handling
- Updated migration plan with completed task: Navigation Enhancements
- Updated migration plan with completed task: Scenario Navigation (Verification)
- Updated migration plan with completed task: Loading States
- Updated migration plan with completed task: Error Boundaries
- Started Phase 5 Testing
- Updated migration plan with completed manual tests
- Updated migration plan with backward compatibility implementation
- Started Phase 6 Cleanup
- Simplified `useScenarioData` hook logic
- Reviewed `CenterControlContext` (no changes needed)
- Refactored server-side metadata loading to use hardcoded map

### Deprecated

- N/A

### Removed

- Old static route `/text-visual/page.tsx`
- Individual `/text-visual-X` scenario metadata folders

### Fixed

- Resolved server-side fetch issue for data files (`fs` module error)

### Security

- N/A

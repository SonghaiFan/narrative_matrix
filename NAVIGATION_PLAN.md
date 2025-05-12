# Navigation Flow Refactoring Plan

## Summary of Implementation

We've successfully centralized the navigation flow for the entire application. Now users:

1. Can log in and select a scenario from the homepage
2. Navigate through introduction → training → tasks → completion
3. Have clear navigation buttons at each stage
4. Don't need to manually change URLs or remember where they left off

The navigation store tracks progress through each stage and remembers completion status, allowing for a more intuitive user experience.

## Current Navigation Issues

- No centralized navigation management
- Manual URL navigation required between stages
- No clear flow between introduction → training → tasks
- Missing completion indicators and next steps
- Authentication checks removed but navigation still fragmented

## Proposed Navigation Architecture

### 1. Create a Navigation Context/Store

- Create a central navigation store using Zustand
- Track user progress (intro, training, tasks completed)
- Store current and next stages for each scenario
- Provide navigation helper functions

### 2. Navigation Flow Stages

For each scenario (text-visual/1, text-visual/2, etc.):

1. **Login** → automatically navigate to appropriate introduction
2. **Introduction** → shows "Continue to Training" button
3. **Training** → shows "Start Real Tasks" button
4. **Tasks** → shows progress and "Complete" button
5. **Completion** → shows summary and option to try another scenario

### 3. Implementation Tasks

#### Core Navigation Store

- [x] Create `src/store/navigation-store.ts` to track progress
- [x] Implement functions: `goToNextStage()`, `goToPreviousStage()`, `completeCurrentStage()`
- [x] Store completion status for intro/training/tasks for each scenario

#### Component Updates

- [x] Create a `NextStageButton` component that appears at the end of each stage
- [x] Add navigation buttons to introduction, training, and task completion screens
- [x] Update login screen to automatically navigate to the first uncompleted stage
- [ ] Update task panel to show progress and "Next" button when appropriate

#### Authentication Update

- [x] Simplify user login to automatically set scenario based on URL or default
- [x] Remove complex scenario routing logic
- [x] Add auto-navigation after login

#### URL and Stage Synchronization

- [x] Create mapping between URLs and stages
- [x] Implement navigation-route synchronization
- [ ] Ensure browser history works correctly with navigation flow

## Migration Strategy (Progress)

1. ✅ Implemented the navigation store with Zustand
2. ✅ Updated introduction page with navigation buttons
3. ✅ Added navigation buttons to training page
4. ✅ Added navigation to the main task page
5. ✅ Updated home page with scenario selection
6. [ ] Test the complete flow from login → intro → training → tasks → completion

## Future Improvements

- Add progress persistence (even without permanent storage)
- Add visual progress indicators
- Add confirmation for navigation between major sections

## Completed Implementation

1. Created a centralized navigation store with Zustand
2. Removed dashboard and simplified the navigation flow
3. Added NextStageButton component for consistent navigation
4. Updated introduction pages to work with the navigation system
5. Added scenario selection after login
6. Simplified the overall application structure

## Remaining Tasks

1. Update task panel to show completion status
2. Ensure completion screen works properly with the navigation system
3. Complete end-to-end testing of the navigation flow
4. Refine the user experience with visual indicators for navigation

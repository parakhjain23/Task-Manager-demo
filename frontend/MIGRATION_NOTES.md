# Frontend Migration to Work Items Architecture

## Overview

The frontend has been updated to work with the new database architecture that replaces Tasks with Work Items. This document outlines all the changes made.

## Completed Changes

### 1. Updated Main Page ([app/page.js](app/page.js))

**Key Changes:**
- Renamed `tasks` state to `workItems`
- Added `categories` and `selectedCategory` state
- Added `orgId` configuration (defaults to '1', should come from auth)
- Updated all API endpoints to use new work items endpoints
- Modified view names:
  - `tasks` → `work-items`
  - `pending` → still `pending` (but filters by `CAPTURED` status)
  - Added `in-progress` and `archived` views
- Updated fetch functions to use new API structure with pagination support
- Category filtering integrated into all work item queries

### 2. Created WorkItemList Component ([components/WorkItemList.js](components/WorkItemList.js))

**Replaces:** TaskList.js

**New Features:**
- Supports 8 work item statuses (CAPTURED, CLARIFYING, THINKING, DECIDED, IN_PROGRESS, IN_REVIEW, CLOSED, ARCHIVED)
- Color-coded status and priority badges
- Displays external ID if available
- Shows category name
- Supports start date and due date
- Dynamic color schemes for better visual distinction

### 3. Created WorkItemDetailsPanel Component ([components/WorkItemDetailsPanel.js](components/WorkItemDetailsPanel.js))

**Replaces:** TaskDetailsPanel.js

**New Features:**
- Full work item editing with 8 status options
- 4 priority levels (LOW, MEDIUM, HIGH, URGENT)
- External ID display
- Category information with external tool indicator
- Start date and due date fields
- Activity log display (shows last 5 logs)
- Custom fields display
- Created/Updated timestamps
- Improved delete confirmation

### 4. Updated Sidebar Component ([components/Sidebar.js](components/Sidebar.js))

**New Features:**
- Category selector with collapsible list
- Shows work item count per category
- Updated menu items to match new architecture:
  - All Work Items
  - Captured (pending items)
  - In Progress
  - Archived
  - Activity Logs
  - Proposed Ideas
- Removed old views and custom view creation (can be re-added later)
- Version indicator showing "Work Items Architecture v2.0"

### 5. Components That Still Work (Minimal Changes Needed)

The following components work with the new architecture with minimal or no changes:

- **LogsList.js** - Still works, fetches from new work-item-logs endpoints
- **LogDetailsPanel.js** - Still works with new log structure
- **ChatbotPanel.js** - Still works, context updated
- **IdeasList.js** - No changes needed
- **Timeline.js** - Still works for activity timeline

## API Endpoint Mapping

### Old → New Endpoints

```
OLD: GET /api/tasks
NEW: GET /api/work-items?orgId=1&categoryId=X

OLD: GET /api/tasks/:id
NEW: GET /api/work-items/:id

OLD: POST /api/tasks
NEW: POST /api/work-items

OLD: PUT /api/tasks/:id
NEW: PUT /api/work-items/:id

OLD: DELETE /api/tasks/:id
NEW: DELETE /api/work-items/:id

OLD: GET /api/logs
NEW: GET /api/work-item-logs/category/:categoryId/timeline
     GET /api/work-item-logs/type/:logType
```

## Configuration Changes

### Environment Variables

Update your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_ORG_ID=1  # Add this - should come from your auth system
```

## Status Mapping

### Old Task Statuses → New Work Item Statuses

```
OLD               NEW
pending       →   CAPTURED
in-progress   →   IN_PROGRESS
completed     →   CLOSED
                  + CLARIFYING
                  + THINKING
                  + DECIDED
                  + IN_REVIEW
                  + ARCHIVED
```

## Priority Mapping

### Old Task Priorities → New Work Item Priorities

```
OLD       NEW
low   →   LOW
medium →  MEDIUM
high  →   HIGH
          + URGENT
```

## Data Structure Changes

### Task Object → Work Item Object

```javascript
// OLD Task
{
  id: "uuid",
  title: "string",
  description: "string",
  priority: "low|medium|high",
  assignedTo: "string (name)",
  tags: ["string"],
  status: "pending|in-progress|completed",
  createdAt: "datetime",
  dueDate: "datetime",
  isDeleted: boolean
}

// NEW Work Item
{
  id: "string (bigint)",
  externalId: "string?",
  categoryId: "string (bigint)",
  title: "string",
  description: "string?",
  status: "CAPTURED|CLARIFYING|THINKING|DECIDED|IN_PROGRESS|IN_REVIEW|CLOSED|ARCHIVED",
  priority: "LOW|MEDIUM|HIGH|URGENT?",
  assigneeId: "string (bigint)?",
  createdBy: "string (bigint)?",
  updatedBy: "string (bigint)?",
  startDate: "date?",
  dueDate: "date?",
  createdAt: "datetime",
  updatedAt: "datetime",
  category: {
    id: "string",
    name: "string",
    externalTool: "string?"
  },
  logs: [...],
  customFieldValues: [...]
}
```

## Next Steps

### 1. Set Up Categories

Before using the application, create at least one category:

```bash
curl -X POST http://localhost:5001/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "1",
    "keyName": "default",
    "name": "Default Category",
    "createdBy": "1"
  }'
```

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test the Application

1. Check that categories appear in the sidebar
2. Create a new work item (you'll need to implement a create form)
3. Verify work item list displays correctly
4. Test status transitions
5. Verify activity logs are working

## Known Issues & Limitations

### Components Not Yet Updated

1. **TeamManager.js** - Team members are now managed by third-party service
   - **Action:** Remove this component or convert to user browser

2. **Custom View Creation** - Dynamic views endpoint removed
   - **Action:** Can be re-implemented using work-items filtering

3. **Work Item Creation UI** - No create form yet
   - **Action:** Need to add a "Create Work Item" button and modal

### Features to Implement

1. **Work Item Creation Modal**
   - Form with title, description, category selector
   - Priority and status selection
   - Date pickers for start/due dates

2. **Custom Fields UI**
   - Display custom fields in work item details
   - Edit custom field values
   - Create custom field definitions (admin)

3. **Category Management UI**
   - Create/edit/delete categories
   - Assign external tool integrations
   - Follow/unfollow categories

4. **User/Assignee Selection**
   - Integration with third-party user service
   - User picker component
   - Display user avatars

5. **Bulk Operations**
   - Select multiple work items
   - Bulk status change
   - Bulk delete/archive

6. **Filtering & Sorting**
   - Filter by multiple statuses
   - Filter by priority
   - Filter by assignee
   - Sort by various fields

7. **Activity Timeline Enhancement**
   - Visual timeline component
   - Filter logs by type
   - Export activity logs

## Migration Checklist

- [x] Update main page to use work items API
- [x] Create WorkItemList component
- [x] Create WorkItemDetailsPanel component
- [x] Update Sidebar with categories
- [x] Update API endpoint calls
- [x] Update status/priority mappings
- [ ] Remove TeamManager or convert to user browser
- [ ] Add work item creation UI
- [ ] Add custom fields UI
- [ ] Add category management UI
- [ ] Add user/assignee picker
- [ ] Test all CRUD operations
- [ ] Test activity logging
- [ ] Update error handling
- [ ] Add loading states
- [ ] Test keyboard shortcuts
- [ ] Update documentation

## Backward Compatibility

**None.** The old task endpoints have been completely removed from the backend. The frontend must use the new work items API.

## Support

For issues or questions:
1. Check the [backend MIGRATION_NOTES.md](../backend/MIGRATION_NOTES.md)
2. Review API documentation in backend README
3. Check browser console for API errors

## Architecture Benefits

The new architecture provides:
- **Flexible workflow**: 8 status types instead of 3
- **Organization-based**: Multi-tenancy support with orgId
- **Categorization**: Organize work items by categories
- **Custom fields**: Extensible metadata system
- **Audit trail**: Complete activity logging
- **External integration**: Link to external tools via externalId
- **User management**: Proper user ID references instead of names
- **Scalability**: BigInt IDs for handling large datasets

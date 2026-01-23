# Database Architecture Migration Notes

## Completed Changes

### 1. New Prisma Schema
- Completely redesigned database schema in `prisma/schema.prisma`
- Removed old models: Task, Log, TeamMember, View
- Added new models: Category, WorkItem, WorkItemLog, CategoryFollower, CustomFieldMetaData, CustomFieldValue

### 2. New API Routes Created
All routes are registered in `server.js` under `/api/`:

- **Categories** (`/api/categories`) - Manage work item categories
- **Work Items** (`/api/work-items`) - Create and manage work items (replaces tasks)
- **Custom Fields** (`/api/custom-fields`) - Define and manage custom fields
- **Work Item Logs** (`/api/work-item-logs`) - Audit trail and activity logs
- **Category Followers** (`/api/category-followers`) - Follow/unfollow categories
- **Chat** (`/api/chat`) - AI chat interface (kept from old architecture)
- **Utility** (`/api/utility`) - Utility endpoints (kept from old architecture)

### 3. Removed Old Routes
The following route files have been deleted:
- `routes/tasks.js`
- `routes/team.js`
- `routes/logs.js`
- `routes/views.js`
- `routes/dynamic-view.js`
- `routes/conversation.js`

### 4. Services Cleanup
- **Simplified** `services/aiService.js` - Only kept `generateChatResponse()` for chat functionality
- **Removed** `services/logClassifier.js` - Background log classification no longer needed

### 5. Models Directory
The `models/` directory contains old model exports that should be removed manually:
- `models/Task.js` - DELETE (no longer exists in schema)
- `models/Log.js` - DELETE (no longer exists in schema)
- `models/TeamMember.js` - DELETE (no longer exists in schema)
- `models/View.js` - DELETE (no longer exists in schema)

**Action Required**: Manually delete the entire `backend/models` directory as it's no longer needed.

## Next Steps to Complete Migration

### 1. Install Node.js and Dependencies
Ensure Node.js is installed, then run:
```bash
cd backend
npm install
```

### 2. Run Prisma Migration
Generate the new database schema:
```bash
npx prisma migrate dev --name redesign_architecture
```

This will:
- Drop old tables (Task, Log, TeamMember, View)
- Create new tables (categories, work_items, work_item_logs, category_followers, custom_field_meta_data, custom_field_values)
- Apply all indexes and constraints

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. (Optional) Seed Initial Data
Create seed data for categories and work items:
```bash
node seed.js
```

### 5. Start the Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Documentation

### Categories
```
POST   /api/categories              - Create category
GET    /api/categories/org/:orgId   - List categories for org
GET    /api/categories/:id          - Get category details
PUT    /api/categories/:id          - Update category
DELETE /api/categories/:id          - Delete category
```

### Work Items
```
POST   /api/work-items              - Create work item
GET    /api/work-items              - List work items (with filters)
GET    /api/work-items/:id          - Get work item details
PUT    /api/work-items/:id          - Update work item
DELETE /api/work-items/:id          - Delete work item
```

Query parameters for listing:
- `categoryId` - Filter by category
- `status` - Filter by status (CAPTURED, CLARIFYING, THINKING, DECIDED, IN_PROGRESS, IN_REVIEW, CLOSED, ARCHIVED)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assigneeId` - Filter by assignee
- `orgId` - Filter by organization
- `search` - Search in title and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

### Custom Fields
```
POST   /api/custom-fields/metadata                    - Create field definition
GET    /api/custom-fields/metadata                    - List field definitions
GET    /api/custom-fields/metadata/:id                - Get field definition
PUT    /api/custom-fields/metadata/:id                - Update field definition
DELETE /api/custom-fields/metadata/:id                - Delete field definition

POST   /api/custom-fields/values                      - Set field value for work item
GET    /api/custom-fields/values/work-item/:id        - Get all field values for work item
DELETE /api/custom-fields/values/:id                  - Delete field value
```

### Work Item Logs
```
POST   /api/work-item-logs                            - Create log entry
GET    /api/work-item-logs/work-item/:id              - Get logs for work item
GET    /api/work-item-logs/:id                        - Get single log
GET    /api/work-item-logs/type/:logType              - Get logs by type
GET    /api/work-item-logs/category/:id/timeline      - Get category timeline
DELETE /api/work-item-logs/:id                        - Delete log
```

### Category Followers
```
POST   /api/category-followers                        - Follow category
DELETE /api/category-followers                        - Unfollow category
GET    /api/category-followers/category/:id           - Get category followers
GET    /api/category-followers/user/:id               - Get user's followed categories
GET    /api/category-followers/check                  - Check follow status
POST   /api/category-followers/bulk/count             - Get follower counts (bulk)
```

## Important Notes

### BigInt Handling
All IDs are stored as BigInt in PostgreSQL for scalability. The API automatically converts them to strings in JSON responses.

### User & Organization IDs
User and organization tables are maintained by a third-party service. The API only stores their IDs as BigInt references.

### Automatic Logging
Work item updates automatically create log entries for:
- Status changes
- Field updates
- AI analysis

### Custom Fields
Custom fields support four data types:
- `number` - Stored as Decimal(15,4)
- `text` - Stored as TEXT
- `boolean` - Stored as BOOLEAN
- `json` - Stored as JSONB

Each work item can have multiple custom field values, one per field definition.

## Backward Compatibility

The old routes have been removed. If you need to migrate data from the old schema:
1. Export data from old tables before running migration
2. Create a data migration script to transform and import into new schema
3. Map old Task → new WorkItem
4. Map old Log → new WorkItemLog
5. TeamMember data may need to be stored in the third-party user service

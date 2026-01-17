# AI-Driven Task Manager

A fully AI-driven task management application where users give instructions in natural language, and AI automatically detects the most eligible person for tasks and assigns relevant tags.

## Features

- Natural language task creation
- AI-powered task analysis using OpenAI GPT-4
- Automatic assignment to team members based on skills and availability
- Auto-tagging of tasks
- Priority detection
- Real-time chat interface
- Task dashboard

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (Prisma ORM)
- OpenAI API (GPT-4)

### Frontend
- Next.js 14
- React

## Project Structure

```
Task manager/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Task.js
│   │   └── TeamMember.js
│   ├── routes/
│   │   ├── tasks.js
│   │   ├── team.js
│   │   └── chat.js
│   ├── services/
│   │   └── aiService.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.js
    │   ├── layout.js
    │   └── globals.css
    ├── components/
    │   ├── ChatInterface.js
    │   └── TaskList.js
    ├── package.json
    └── .env.local.example
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- OpenAI API key

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and add your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/task_manager?schema=public"
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

5. Run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file from the example:
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

5. Start the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Adding Team Members

Before creating tasks, you need to add team members. Use an API client like Postman or curl:

```bash
curl -X POST http://localhost:5000/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "skills": ["frontend", "react", "javascript"],
    "availability": "available"
  }'
```

Add multiple team members:

```bash
curl -X POST http://localhost:5000/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "skills": ["backend", "nodejs", "database"],
    "availability": "available"
  }'

curl -X POST http://localhost:5000/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mike Johnson",
    "skills": ["devops", "docker", "kubernetes"],
    "availability": "available"
  }'
```

## Usage

1. Open the frontend at `http://localhost:3000`
2. Use the chat interface to create tasks in natural language

### Example Commands

- "Create a new task to fix the login bug with high priority"
- "Add a task to implement user authentication, assign it to someone with backend skills"
- "Create a task for updating the homepage design, priority medium"
- "Add a high priority task to deploy the application to production"

The AI will automatically:
- Extract the task title and description
- Detect the priority level
- Assign the most suitable team member based on skills
- Add relevant tags

## API Endpoints

### Tasks
- `POST /api/tasks/create` - Create a new task with AI analysis
- `GET /api/tasks` - Get all tasks
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Team
- `POST /api/team` - Add a team member
- `GET /api/team` - Get all team members
- `PUT /api/team/:id` - Update a team member
- `DELETE /api/team/:id` - Delete a team member

### Chat
- `POST /api/chat` - General chat with AI assistant

## Database Schema

### Task
```javascript
{
  title: String,
  description: String,
  priority: 'low' | 'medium' | 'high',
  assignedTo: String,
  tags: [String],
  status: 'pending' | 'in-progress' | 'completed',
  createdAt: Date,
  dueDate: Date
}
```

### TeamMember
```javascript
{
  name: String,
  skills: [String],
  currentWorkload: Number,
  availability: 'available' | 'busy' | 'unavailable'
}
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string (Prisma)
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - Server port (default: 5000)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Future Enhancements

- User authentication
- Task status updates via chat
- Task reassignment
- Due date reminders
- Task analytics and reporting
- Team member performance tracking
- Integration with calendar services
- Email notifications

## License

MIT

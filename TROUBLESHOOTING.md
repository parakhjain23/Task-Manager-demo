# Troubleshooting Guide

## OpenAI API Error: "Failed to generate response"

### Issue
You're seeing the error: `{"error":"Failed to generate response"}` when trying to use the chat.

### Possible Causes & Solutions

#### 1. Invalid API Key

**Symptoms:** API returns authentication errors

**Solution:**
- Your API key appears to start with `ysk-proj-` which is unusual
- Valid OpenAI keys typically start with `sk-proj-` or `sk-`
- Steps to fix:
  1. Go to https://platform.openai.com/api-keys
  2. Create a new API key
  3. Copy the ENTIRE key (it should start with `sk-`)
  4. Update your [backend/.env](backend/.env) file:
     ```
     OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
     ```
  5. Restart the backend server

#### 2. No Credits / Quota Exhausted

**Symptoms:** API returns quota or billing errors

**Solution:**
1. Check your OpenAI account billing at https://platform.openai.com/account/billing
2. Add credits to your account
3. Verify you have an active payment method

#### 3. Model Access Issues

**Symptoms:** Error mentions model availability

**Solution:**
- The code now uses `gpt-4o-mini` which is more widely available
- If you still have issues, you can change to `gpt-3.5-turbo`:
  1. Open [backend/services/aiService.js](backend/services/aiService.js)
  2. Change both instances of `model: "gpt-4o-mini"` to `model: "gpt-3.5-turbo"`
  3. Restart the backend

#### 4. No Team Members Added

**Symptoms:** Error says "No team members available"

**Solution:**
You must add team members before creating tasks. Use curl or Postman:

```bash
curl -X POST http://localhost:5001/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "skills": ["frontend", "react", "javascript"],
    "availability": "available"
  }'

curl -X POST http://localhost:5001/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "skills": ["backend", "nodejs", "database"],
    "availability": "available"
  }'
```

#### 5. Backend Server Not Running

**Symptoms:** Connection refused errors

**Solution:**
1. Make sure backend server is running:
   ```bash
   cd backend
   npm run dev
   ```
2. Check if it's running on port 5001:
   ```bash
   curl http://localhost:5001/api/health
   ```
3. Should return: `{"status":"ok","message":"Task Manager API is running"}`

#### 6. MongoDB Connection Issues

**Symptoms:** Database connection errors in backend logs

**Solution:**
1. Verify your MongoDB Atlas connection string in [backend/.env](backend/.env)
2. Make sure your IP is whitelisted in MongoDB Atlas
3. Check if the database name is correct
4. Test connection: The backend logs should show "MongoDB connected successfully"

## Testing the API Key

Run this command to test your OpenAI key:

```bash
cd backend
node test-openai.js
```

This will show detailed error information.

## Check Backend Logs

Always check the terminal where your backend is running. It will show detailed error messages that help identify the issue.

Look for:
- `MongoDB connected successfully` - Database is working
- Any OpenAI API errors with specific codes
- Stack traces that point to the issue

## Still Having Issues?

1. **Restart both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Check your .env files:**
   - [backend/.env](backend/.env) should have valid MongoDB URI and OpenAI key
   - [frontend/.env.local](frontend/.env.local) should point to `http://localhost:5001/api`

3. **Verify all services:**
   - MongoDB is running/accessible
   - OpenAI API key is valid and has credits
   - Team members are added
   - Ports 3000 and 5001 are not blocked

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Incorrect API key provided` | Wrong OpenAI key | Update OPENAI_API_KEY in .env |
| `You exceeded your current quota` | No OpenAI credits | Add credits to OpenAI account |
| `No team members available` | No team in database | Add team members via API |
| `Failed to fetch tasks` | Backend not running | Start backend server |
| `ECONNREFUSED` | Wrong port or server down | Check server is on port 5001 |

## Debug Mode

To enable more verbose logging, update [backend/server.js](backend/server.js) to add:

```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

This will log all API requests.

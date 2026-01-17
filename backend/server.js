require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const logClassifier = require('./services/logClassifier');

// Import routes
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/team');
const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversation');
const dynamicViewRoutes = require('./routes/dynamic-view');
const viewsRoutes = require('./routes/views');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/dynamic-view', dynamicViewRoutes);
app.use('/api/views', viewsRoutes);
app.use('/api/logs', logsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task Manager API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start background log classifier
  logClassifier.start();
  console.log('Background log classifier started');
});

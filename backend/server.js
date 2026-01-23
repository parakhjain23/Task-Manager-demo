require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

// Import routes
const categoriesRoutes = require('./routes/categories');
const workItemsRoutes = require('./routes/workItems');
const customFieldsRoutes = require('./routes/customFields');
const workItemLogsRoutes = require('./routes/workItemLogs');
const categoryFollowersRoutes = require('./routes/categoryFollowers');
const chatRoutes = require('./routes/chat');
const utilityRoutes = require('./routes/utility.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/work-items', workItemsRoutes);
app.use('/api/custom-fields', customFieldsRoutes);
app.use('/api/work-item-logs', workItemLogsRoutes);
app.use('/api/category-followers', categoryFollowersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/utility', utilityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task Manager API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Task Manager API ready with new architecture');
});

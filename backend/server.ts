import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';

// Import routes
import categoriesRoutes from './routes/categories';
import workItemsRoutes from './routes/workItems';
import customFieldsRoutes from './routes/customFields';
import workItemLogsRoutes from './routes/workItemLogs';
import categoryFollowersRoutes from './routes/categoryFollowers';
import chatRoutes from './routes/chat';
import utilityRoutes from './routes/utility';

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

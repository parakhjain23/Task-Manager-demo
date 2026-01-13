'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import ChatInterface from '../components/ChatInterface';
import TeamManager from '../components/TeamManager';
import TaskDetailsPanel from '../components/TaskDetailsPanel';
import './globals.css';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('tasks');
  const [customViewName, setCustomViewName] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/tasks`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setCustomViewName(null);

    // Refetch all tasks when switching to 'tasks' or 'pending' view
    if (view === 'tasks' || view === 'pending') {
      fetchTasks();
    }
  };

  const handleCustomView = (viewName, filteredTasks) => {
    setTasks(filteredTasks);
    setCustomViewName(viewName);
    setCurrentView('custom');
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleTaskUpdate = (updatedTask, isDeleted = false) => {
    if (isDeleted) {
      // Remove deleted task
      setTasks(prev => prev.filter(t => t._id !== selectedTask._id));
    } else if (updatedTask) {
      // Update the task in the list
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      setSelectedTask(updatedTask);
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');

  const renderContent = () => {
    if (currentView === 'members') {
      return (
        <div className="full-width-content">
          <TeamManager />
        </div>
      );
    }

    if (currentView === 'pending') {
      return (
        <>
          <div className="main-grid">
            <TaskList
              tasks={pendingTasks}
              loading={loading}
              error={error}
              onTaskClick={handleTaskClick}
            />
            <ChatInterface onTaskCreated={handleTaskCreated} onCustomView={handleCustomView} />
          </div>
        </>
      );
    }

    if (currentView === 'custom') {
      return (
        <div className="main-grid">
          <TaskList
            tasks={tasks}
            loading={loading}
            error={error}
            onTaskClick={handleTaskClick}
          />
          <ChatInterface onTaskCreated={handleTaskCreated} onCustomView={handleCustomView} />
        </div>
      );
    }

    return (
      <div className="main-grid">
        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onTaskClick={handleTaskClick}
        />
        <ChatInterface onTaskCreated={handleTaskCreated} onCustomView={handleCustomView} />
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onCustomViewRequest={handleCustomView}
      />

      <div className="container">
        <div className="app-header">
          <div className="app-title">
            <h1>
              {currentView === 'members' && 'Team Members'}
              {currentView === 'pending' && 'My Pending Tasks'}
              {currentView === 'tasks' && 'All Tasks'}
              {currentView === 'custom' && (customViewName || 'Custom View')}
            </h1>
          </div>
          <div className="header-badge">AI Assistant</div>
        </div>

        {renderContent()}
      </div>

      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetailsPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}

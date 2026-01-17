'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import LogsList from '../components/LogsList';
import TeamManager from '../components/TeamManager';
import TaskDetailsPanel from '../components/TaskDetailsPanel';
import './globals.css';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('logs');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Chatbot state
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
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

  const fetchLogs = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/logs`);

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching logs:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (currentView === 'logs') {
      fetchLogs(true); // Show loading on initial fetch
      // Poll for updates every 5 seconds without showing loading state
      const interval = setInterval(() => fetchLogs(false), 5000);
      return () => clearInterval(interval);
    } else if (currentView === 'tasks' || currentView === 'pending') {
      fetchTasks();
    }
  }, [currentView]);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    // If the log has an associated task, we can optionally load it
    if (log.taskId) {
      setSelectedTask(log.taskId);
    }
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

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Build conversation history with task context if available
    let contextMessage = userMessage;
    if (selectedTask) {
      contextMessage = `[Task Context: "${selectedTask.title}" - ${selectedTask.status}, Priority: ${selectedTask.priority}]\nUser: ${userMessage}`;
    }

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: contextMessage }
    ];
    setConversationHistory(updatedHistory);

    setChatLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: updatedHistory
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Add the new log to the logs list if we're in logs view
        if (data.log && currentView === 'logs') {
          setLogs(prev => [data.log, ...prev]);
        }
      } else {
        const errorData = await response.json();
        console.error('Error:', errorData.error || 'Failed to process request.');
      }
    } catch (error) {
      console.error('Error chatting:', error);
    } finally {
      setChatLoading(false);
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

    if (currentView === 'logs') {
      return (
        <LogsList
          logs={logs}
          loading={loading}
          error={error}
          onLogClick={handleLogClick}
        />
      );
    }

    if (currentView === 'pending') {
      return (
        <TaskList
          tasks={pendingTasks}
          loading={loading}
          error={error}
          onTaskClick={handleTaskClick}
        />
      );
    }

    return (
      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onTaskClick={handleTaskClick}
      />
    );
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <div className="container">
        <div className="app-header">
          <div className="app-title">
            <h1>
              {currentView === 'logs' && 'Conversation Logs'}
              {currentView === 'members' && 'Team Members'}
              {currentView === 'pending' && 'My Pending Tasks'}
              {currentView === 'tasks' && 'All Tasks'}
            </h1>
          </div>
          <div className="header-badge">
            {currentView === 'logs' ? 'AI Chat Assistant' : 'Task-specific AI Assistant'}
          </div>
        </div>

        {renderContent()}

        {/* Bottom Center Chatbot */}
        <div className="bottom-chatbot-container">
          {/* Chat Input Form */}
          <form onSubmit={handleChatSubmit} className="bottom-chatbot-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={selectedTask ? `Log message about "${selectedTask.title}"...` : "Log a message..."}
              className="bottom-chatbot-input"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="bottom-chatbot-send-button"
            >
              {chatLoading ? '⋯' : '→'}
            </button>
          </form>
        </div>
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

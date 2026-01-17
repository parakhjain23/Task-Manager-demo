'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import LogsList from '../components/LogsList';
import TeamManager from '../components/TeamManager';
import TaskDetailsPanel from '../components/TaskDetailsPanel';
import LogDetailsPanel from '../components/LogDetailsPanel';
import './globals.css';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('logs');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [customViewTitle, setCustomViewTitle] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);



  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const endpoint = currentView === 'deleted' ? 'tasks/deleted' : 'tasks';
      const response = await fetch(`${API_URL}/${endpoint}`);

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
    } else if (currentView === 'tasks' || currentView === 'pending' || currentView === 'deleted') {
      fetchTasks();
    }
  }, [currentView]);

  const handleViewChange = (view) => {
    setCurrentView(view);
    setCustomViewTitle('');
    setSearchQuery('');
  };

  const handleCustomViewRequest = (viewName, customTasks) => {
    setCustomViewTitle(viewName);
    setTasks(customTasks);
    setCurrentView('custom');
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
  };

  const handleTaskUpdate = (updatedTask, isDeleted = false) => {
    if (isDeleted) {
      // Remove deleted task
      setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
    } else if (updatedTask) {
      // Update the task in the list
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
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

  const filteredTasks = tasks.filter(task => {
    const searchLower = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      task.assignedTo?.toLowerCase().includes(searchLower)
    );
  });

  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    return log.userInput?.toLowerCase().includes(searchLower);
  });

  const pendingTasks = filteredTasks.filter(task => task.status === 'pending');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't navigate if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      const items = currentView === 'logs' ? filteredLogs : (currentView === 'pending' ? pendingTasks : filteredTasks);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < items.length) {
          const selectedItem = items[activeIndex];
          if (currentView === 'logs') {
            handleLogClick(selectedItem);
          } else {
            handleTaskClick(selectedItem);
          }
        }
      } else if (e.key === 'Escape') {
        if (selectedLog) setSelectedLog(null);
        if (selectedTask) setSelectedTask(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, filteredLogs, filteredTasks, pendingTasks, activeIndex]);

  // Reset active index when view or search changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [currentView, searchQuery]);

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
          logs={filteredLogs}
          loading={loading}
          error={error}
          onLogClick={handleLogClick}
          activeIndex={activeIndex}
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
          activeIndex={activeIndex}
        />
      );
    }

    return (
      <TaskList
        tasks={filteredTasks}
        loading={loading}
        error={error}
        onTaskClick={handleTaskClick}
        activeIndex={activeIndex}
      />
    );
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onCustomViewRequest={handleCustomViewRequest}
      />

      <div className="container">
        <div className="app-header">
          <div className="app-title">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1>
                {currentView === 'logs' && 'Work Items'}
                {currentView === 'members' && 'Team Members'}
                {currentView === 'pending' && 'My Pending Tasks'}
                {currentView === 'tasks' && 'All Tasks'}
                {currentView === 'deleted' && 'Deleted Items'}
                {currentView === 'custom' && customViewTitle}
              </h1>
              {currentView === 'deleted' && (
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '400', marginTop: '4px' }}>
                  Items here can be recovered to your active list.
                </span>
              )}
            </div>
          </div>

          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={`Search ${currentView === 'logs' ? 'work items' : 'tasks'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="header-badge">
            {currentView === 'logs' ? 'AI Chat Assistant' : 'Task-specific AI Assistant'}
          </div>
        </div>

        {renderContent()}

        {/* Bottom Center Chatbot - Only in Logs view */}
        {currentView === 'logs' && (
          <div className="bottom-chatbot-container">
            {/* Chat Input Form */}
            <form onSubmit={handleChatSubmit} className="bottom-chatbot-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Log a message..."
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
        )}
      </div>

      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetailsPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* Log Details Panel */}
      {selectedLog && (
        <LogDetailsPanel
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

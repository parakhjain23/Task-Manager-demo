'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import TeamManager from '../components/TeamManager';
import TaskDetailsPanel from '../components/TaskDetailsPanel';
import './globals.css';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('tasks');
  const [selectedTask, setSelectedTask] = useState(null);

  // Chatbot state
  const [chatInput, setChatInput] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

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

  const handleViewChange = (view) => {
    setCurrentView(view);

    // Refetch all tasks when switching to 'tasks' or 'pending' view
    if (view === 'tasks' || view === 'pending') {
      fetchTasks();
    }
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
        const aiResponse = data.response || 'No response from AI';
        setLastResponse(aiResponse);

        // Add AI response to conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'ai', content: aiResponse }
        ]);

        // If a task was created, refresh the task list
        if (data.shouldCreateTask && data.task) {
          setTasks(prev => [data.task, ...prev]);
        }
      } else {
        const errorData = await response.json();
        setLastResponse(errorData.error || 'Failed to get response. Please try again.');
      }
    } catch (error) {
      console.error('Error chatting:', error);
      setLastResponse('Failed to connect to AI. Please try again.');
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
              {currentView === 'members' && 'Team Members'}
              {currentView === 'pending' && 'My Pending Tasks'}
              {currentView === 'tasks' && 'All Tasks'}
            </h1>
          </div>
          <div className="header-badge">Task-specific AI Assistant</div>
        </div>

        {renderContent()}

        {/* Bottom Center Chatbot */}
        <div className="bottom-chatbot-container">
          {/* Last Response Display */}
          {lastResponse && (
            <div className="bottom-chatbot-response">
              <div className="bottom-chatbot-response-label">AI Response:</div>
              <div className="bottom-chatbot-response-text">{lastResponse}</div>
            </div>
          )}

          {/* Chat Input Form */}
          <form onSubmit={handleChatSubmit} className="bottom-chatbot-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={selectedTask ? `Ask about "${selectedTask.title}"...` : "Ask about tasks..."}
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

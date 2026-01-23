'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatInterface({ onTaskCreated, onCustomView }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Hello! I\'m your AI task manager. You can:\n• Chat with me naturally\n• Ask me to create tasks\n• Request custom views (e.g., "show me pending tasks created today" or "display high priority tasks due this week")\n\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectViewRequest = (message) => {
    const viewKeywords = [
      'show me', 'view', 'filter', 'display', 'find', 'get me',
      'tasks created', 'tasks due', 'pending tasks', 'completed tasks',
      'high priority', 'low priority', 'today', 'this week', 'this month'
    ];

    const lowerMessage = message.toLowerCase();
    return viewKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to conversation
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

      // Check if this is a view request
      if (detectViewRequest(userMessage)) {
        const viewResponse = await fetch(`${API_URL}/dynamic-view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userMessage,
            currentUser: null // Can be set if user authentication is implemented
          })
        });

        const viewData = await viewResponse.json();

        if (viewResponse.ok) {
          setMessages(prev => [...prev, {
            role: 'ai',
            content: `I found ${viewData.count} task${viewData.count !== 1 ? 's' : ''} matching your request: "${viewData.viewName}". Displaying them now.`
          }]);

          // Notify parent to switch to custom view
          if (onCustomView) {
            onCustomView(viewData.viewName, viewData.tasks);
          }
        } else {
          setMessages(prev => [...prev, {
            role: 'ai',
            content: viewData.error || 'Sorry, I couldn\'t create that view.'
          }]);
        }
      } else {
        // Use the conversational endpoint for regular chat/task creation
        const response = await fetch(`${API_URL}/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHistory: updatedMessages
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Add AI response to messages
          setMessages(prev => [...prev, {
            role: 'ai',
            content: data.response
          }]);

          // If a task was created, notify parent component
          if (data.shouldCreateTask && data.task && onTaskCreated) {
            onTaskCreated(data.task);
          }
        } else {
          setMessages(prev => [...prev, {
            role: 'ai',
            content: data.response || 'Sorry, I couldn\'t process that request.'
          }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please make sure the backend server is running.'
      }]);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>🤖 AI Task Assistant</h2>
        <div className="chat-status">
          <span className="status-dot"></span>
          <span>Online</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message message-${message.role}`}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="message message-ai">
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Create a task' or 'Show me pending tasks from this week'"
            className="chat-input"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="chat-submit"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

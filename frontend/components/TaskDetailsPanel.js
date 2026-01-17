'use client';

import { useState } from 'react';

export default function TaskDetailsPanel({ task, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [loading, setLoading] = useState(false);

  // Task-specific chatbot state
  const [chatInput, setChatInput] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [taskConversationHistory, setTaskConversationHistory] = useState([]);

  if (!task) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTask)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        if (onUpdate) onUpdate(updatedTask);
        setIsEditing(false);
      } else {
        alert('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Direct delete, no alert as requested
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (onUpdate) onUpdate(null, true); // true indicates deletion
        onClose();
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleRecover = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/tasks/${task.id}/recover`, {
        method: 'PUT'
      });

      if (response.ok) {
        const updatedTask = await response.json();
        // Since it's no longer deleted, we remove it from the deleted view
        if (onUpdate) onUpdate(null, true);
        onClose();
      } else {
        alert('Failed to recover task');
      }
    } catch (error) {
      console.error('Error recovering task:', error);
      alert('Failed to recover task. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#2563eb';
      case 'pending': return '#d97706';
      default: return '#6b7280';
    }
  };

  const handleTaskChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Always include task context for this chatbot
    const contextMessage = `[Task Context: "${task.title}" - ${task.description} - Status: ${task.status}, Priority: ${task.priority}]\nUser Question: ${userMessage}`;

    const updatedHistory = [
      ...taskConversationHistory,
      { role: 'user', content: contextMessage }
    ];
    setTaskConversationHistory(updatedHistory);

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
        setTaskConversationHistory(prev => [
          ...prev,
          { role: 'ai', content: aiResponse }
        ]);
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

  return (
    <>
      <div className="task-details-overlay" onClick={onClose}></div>
      <div className="task-details-panel">
        <div className="task-details-header">
          <h2 className="task-details-title">Task Details</h2>
          <button onClick={onClose} className="task-details-close">✕</button>
        </div>

        {/* Split into two sections: Task Details (top) and Chatbot (bottom) */}
        <div className="task-details-split-container">
          {/* Top Section: Task Details */}
          <div className="task-details-content task-details-scrollable">
            {/* Title */}
            <div className="task-detail-section">
              <label className="task-detail-label">Title</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="task-detail-input"
                />
              ) : (
                <div className="task-detail-value task-title-large">{task.title}</div>
              )}
            </div>

            {/* Description */}
            <div className="task-detail-section">
              <label className="task-detail-label">Description</label>
              {isEditing ? (
                <textarea
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  className="task-detail-textarea"
                  rows={4}
                />
              ) : (
                <div className="task-detail-value">{task.description}</div>
              )}
            </div>

            {/* Status and Priority Row */}
            <div className="task-detail-row">
              <div className="task-detail-section">
                <label className="task-detail-label">Status</label>
                {isEditing ? (
                  <select
                    value={editedTask.status}
                    onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                    className="task-detail-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <div className="task-detail-badge" style={{ backgroundColor: getStatusColor(task.status) }}>
                    {task.status}
                  </div>
                )}
              </div>

              <div className="task-detail-section">
                <label className="task-detail-label">Priority</label>
                {isEditing ? (
                  <select
                    value={editedTask.priority}
                    onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                    className="task-detail-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <div className="task-detail-badge" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                    {task.priority}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned To */}
            <div className="task-detail-section">
              <label className="task-detail-label">Assigned To</label>
              <div className="task-detail-value">
                {task.assignedTo ? (
                  <span className="task-assignee">👤 {task.assignedTo}</span>
                ) : (
                  <span className="task-unassigned">Unassigned</span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="task-detail-section">
              <label className="task-detail-label">Tags</label>
              <div className="task-tags-container">
                {task.tags && task.tags.length > 0 ? (
                  task.tags.map((tag, index) => (
                    <span key={index} className="task-tag">{tag}</span>
                  ))
                ) : (
                  <span className="task-no-tags">No tags</span>
                )}
              </div>
            </div>

            {/* Dates Row */}
            <div className="task-detail-row">
              <div className="task-detail-section">
                <label className="task-detail-label">Created</label>
                <div className="task-detail-value task-date">
                  📅 {formatDate(task.createdAt)}
                </div>
              </div>

              <div className="task-detail-section">
                <label className="task-detail-label">Due Date</label>
                <div className="task-detail-value task-date">
                  {task.dueDate ? `📅 ${formatDate(task.dueDate)}` : 'Not set'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="task-details-actions">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setEditedTask(task);
                      setIsEditing(false);
                    }}
                    className="task-action-button secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="task-action-button primary"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  {task.isDeleted ? (
                    <button
                      onClick={handleRecover}
                      className="task-action-button primary"
                    >
                      Recover Task
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleDelete}
                        className="task-action-button danger"
                      >
                        Delete Task
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="task-action-button primary"
                      >
                        Edit Task
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          {/* End of Top Section: Task Details */}

          {/* Bottom Section: Task-Specific Chatbot */}
          <div className="task-chatbot-section">
            <div className="task-chatbot-header">
              <span className="task-chatbot-title">💬 Ask about this task</span>
            </div>

            {/* Last Response Display */}
            {lastResponse && (
              <div className="task-chatbot-response">
                <div className="task-chatbot-response-label">AI Response:</div>
                <div className="task-chatbot-response-text">{lastResponse}</div>
              </div>
            )}

            {/* Chat Input Form */}
            <form onSubmit={handleTaskChatSubmit} className="task-chatbot-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this task..."
                className="task-chatbot-input"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="task-chatbot-send-button"
              >
                {chatLoading ? '⋯' : '→'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

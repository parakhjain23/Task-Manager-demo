'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, User, Tag, Calendar, RotateCcw, CheckCircle2, History } from 'lucide-react';
import Timeline from './Timeline';

export default function TaskDetailsPanel({ task, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [fullTaskData, setFullTaskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);


  useEffect(() => {
    const fetchFullDetails = async () => {
      if (!task?.id) return;

      setDetailsLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL}/tasks/${task.id}`);
        if (response.ok) {
          const data = await response.json();
          setFullTaskData(data);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchFullDetails();
  }, [task?.id]);

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


  return (
    <div className="task-details-panel">
      <div className="task-details-header">
        <h2 className="task-details-title">Task Details</h2>
        <div className="task-details-header-actions">
          {!isEditing && !task.isDeleted && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="task-header-icon-button"
                title="Edit Task"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="task-header-icon-button danger"
                title="Delete Task"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          {task.isDeleted && (
            <button
              onClick={handleRecover}
              className="task-header-icon-button primary"
              title="Recover Task"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button onClick={onClose} className="task-details-close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Task Details Content */}
      <div className="task-details-content">
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
              <span className="task-assignee">
                <User size={14} /> {task.assignedTo}
              </span>
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
                <span key={index} className="task-tag">
                  <Tag size={12} style={{ marginRight: '4px' }} />
                  {tag}
                </span>
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
              <Calendar size={14} /> {formatDate(task.createdAt)}
            </div>
          </div>

          <div className="task-detail-section">
            <label className="task-detail-label">Due Date</label>
            <div className="task-detail-value task-date">
              <Calendar size={14} /> {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
            </div>
          </div>
        </div>

        {/* Source Activity Timeline */}
        {fullTaskData?.logs && fullTaskData.logs.length > 0 && (
          <div className="task-detail-section" style={{ marginTop: '24px' }}>
            <label className="task-detail-label">Task Origin Timeline</label>
            <Timeline
              createdAt={fullTaskData.logs[0].createdAt}
              analyzedAt={fullTaskData.logs[0].analyzedAt}
              isClassified={fullTaskData.logs[0].isClassified}
              isTask={fullTaskData.logs[0].isTask}
              taskTitle={task.title}
            />
          </div>
        )}

        {/* Action Buttons - Keep for Editing State */}
        {isEditing && (
          <div className="task-details-actions">
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
          </div>
        )}
      </div>
    </div>
  );
}

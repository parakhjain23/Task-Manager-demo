'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, User, Tag, Calendar, RotateCcw, CheckCircle2, History, ExternalLink } from 'lucide-react';

export default function WorkItemDetailsPanel({ workItem, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorkItem, setEditedWorkItem] = useState(workItem);
  const [fullWorkItemData, setFullWorkItemData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchFullDetails = async () => {
      if (!workItem?.id) return;

      setDetailsLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL}/work-items/${workItem.id}`);
        if (response.ok) {
          const data = await response.json();
          setFullWorkItemData(data);
        }
      } catch (error) {
        console.error('Error fetching work item details:', error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchFullDetails();
  }, [workItem?.id]);

  if (!workItem) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/work-items/${workItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedWorkItem)
      });

      if (response.ok) {
        const updatedWorkItem = await response.json();
        if (onUpdate) onUpdate(updatedWorkItem);
        setIsEditing(false);
      } else {
        alert('Failed to update work item');
      }
    } catch (error) {
      console.error('Error updating work item:', error);
      alert('Failed to update work item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this work item? This action cannot be undone.')) {
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/work-items/${workItem.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (onUpdate) onUpdate(null, true); // true indicates deletion
        onClose();
      } else {
        alert('Failed to delete work item');
      }
    } catch (error) {
      console.error('Error deleting work item:', error);
      alert('Failed to delete work item. Please try again.');
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

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#ef4444',
      'URGENT': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      'CAPTURED': '#94a3b8',
      'CLARIFYING': '#60a5fa',
      'THINKING': '#a78bfa',
      'DECIDED': '#34d399',
      'IN_PROGRESS': '#fbbf24',
      'IN_REVIEW': '#fb923c',
      'CLOSED': '#22c55e',
      'ARCHIVED': '#6b7280'
    };
    return colors[status] || '#94a3b8';
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="task-details-panel">
      <div className="task-details-header">
        <h2 className="task-details-title">Work Item Details</h2>
        <div className="task-details-header-actions">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="task-header-icon-button"
                title="Edit Work Item"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="task-header-icon-button danger"
                title="Delete Work Item"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          <button onClick={onClose} className="task-details-close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Work Item Details Content */}
      <div className="task-details-content">
        {/* Title */}
        <div className="task-detail-section">
          <label className="task-detail-label">Title</label>
          {isEditing ? (
            <input
              type="text"
              value={editedWorkItem.title}
              onChange={(e) => setEditedWorkItem({ ...editedWorkItem, title: e.target.value })}
              className="task-detail-input"
            />
          ) : (
            <div className="task-detail-value task-title-large">
              {workItem.title}
              {workItem.externalId && (
                <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '12px', fontWeight: 'normal' }}>
                  <ExternalLink size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {workItem.externalId}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="task-detail-section">
          <label className="task-detail-label">Description</label>
          {isEditing ? (
            <textarea
              value={editedWorkItem.description || ''}
              onChange={(e) => setEditedWorkItem({ ...editedWorkItem, description: e.target.value })}
              className="task-detail-textarea"
              rows={4}
            />
          ) : (
            <div className="task-detail-value">{workItem.description || 'No description provided'}</div>
          )}
        </div>

        {/* Category */}
        {workItem.category && (
          <div className="task-detail-section">
            <label className="task-detail-label">Category</label>
            <div className="task-detail-value">
              <span className="task-tag">
                <Tag size={12} style={{ marginRight: '4px' }} />
                {workItem.category.name}
              </span>
              {workItem.category.externalTool && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
                  via {workItem.category.externalTool}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status and Priority Row */}
        <div className="task-detail-row">
          <div className="task-detail-section">
            <label className="task-detail-label">Status</label>
            {isEditing ? (
              <select
                value={editedWorkItem.status}
                onChange={(e) => setEditedWorkItem({ ...editedWorkItem, status: e.target.value })}
                className="task-detail-select"
              >
                <option value="CAPTURED">Captured</option>
                <option value="CLARIFYING">Clarifying</option>
                <option value="THINKING">Thinking</option>
                <option value="DECIDED">Decided</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            ) : (
              <div className="task-detail-badge" style={{ backgroundColor: getStatusColor(workItem.status) }}>
                {formatStatus(workItem.status)}
              </div>
            )}
          </div>

          <div className="task-detail-section">
            <label className="task-detail-label">Priority</label>
            {isEditing ? (
              <select
                value={editedWorkItem.priority || 'MEDIUM'}
                onChange={(e) => setEditedWorkItem({ ...editedWorkItem, priority: e.target.value })}
                className="task-detail-select"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            ) : (
              workItem.priority ? (
                <div className="task-detail-badge" style={{ backgroundColor: getPriorityColor(workItem.priority) }}>
                  {workItem.priority}
                </div>
              ) : (
                <span className="task-unassigned">Not set</span>
              )
            )}
          </div>
        </div>

        {/* Dates Row */}
        <div className="task-detail-row">
          <div className="task-detail-section">
            <label className="task-detail-label">Start Date</label>
            <div className="task-detail-value task-date">
              <Calendar size={14} /> {workItem.startDate ? formatDateOnly(workItem.startDate) : 'Not set'}
            </div>
          </div>

          <div className="task-detail-section">
            <label className="task-detail-label">Due Date</label>
            <div className="task-detail-value task-date">
              <Calendar size={14} /> {workItem.dueDate ? formatDateOnly(workItem.dueDate) : 'Not set'}
            </div>
          </div>
        </div>

        {/* Created/Updated Row */}
        <div className="task-detail-row">
          <div className="task-detail-section">
            <label className="task-detail-label">Created</label>
            <div className="task-detail-value task-date">
              <Calendar size={14} /> {formatDate(workItem.createdAt)}
            </div>
          </div>

          <div className="task-detail-section">
            <label className="task-detail-label">Last Updated</label>
            <div className="task-detail-value task-date">
              <Calendar size={14} /> {formatDate(workItem.updatedAt)}
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        {fullWorkItemData?.logs && fullWorkItemData.logs.length > 0 && (
          <div className="task-detail-section" style={{ marginTop: '24px' }}>
            <label className="task-detail-label">
              <History size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Activity Log ({fullWorkItemData.logs.length})
            </label>
            <div style={{ marginTop: '12px' }}>
              {fullWorkItemData.logs.slice(0, 5).map((log, index) => (
                <div
                  key={log.id}
                  style={{
                    padding: '10px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>
                      {log.logType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {log.message && (
                    <div style={{ color: '#6b7280' }}>{log.message}</div>
                  )}
                  {(log.oldValue || log.newValue) && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {log.oldValue && <span>From: <strong>{log.oldValue}</strong></span>}
                      {log.oldValue && log.newValue && <span> → </span>}
                      {log.newValue && <span>To: <strong>{log.newValue}</strong></span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {fullWorkItemData?.customFieldValues && fullWorkItemData.customFieldValues.length > 0 && (
          <div className="task-detail-section" style={{ marginTop: '24px' }}>
            <label className="task-detail-label">Custom Fields</label>
            <div style={{ marginTop: '12px' }}>
              {fullWorkItemData.customFieldValues.map((field) => (
                <div
                  key={field.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <span style={{ fontWeight: '500', color: '#374151' }}>
                    {field.customFieldMetaData?.name}:
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    {field.valueText || field.valueNumber || (field.valueBoolean !== null ? field.valueBoolean.toString() : JSON.stringify(field.valueJson))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Keep for Editing State */}
        {isEditing && (
          <div className="task-details-actions">
            <button
              onClick={() => {
                setEditedWorkItem(workItem);
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

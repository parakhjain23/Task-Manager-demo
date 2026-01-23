'use client';

import { useRef, useEffect } from 'react';
import { ClipboardList, Loader2, AlertTriangle, FileText, Calendar, User } from 'lucide-react';

export default function WorkItemList({ workItems, loading, error, onWorkItemClick, activeIndex }) {
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="task-list">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={22} /> Work Items
        </h2>
        <div className="loading">
          <Loader2 className="animate-spin" size={20} /> Loading work items...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={22} /> Work Items
        </h2>
        <div className="error">
          <AlertTriangle size={20} /> {error}
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ');
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

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#ef4444',
      'URGENT': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div className="task-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <ClipboardList size={22} /> Work Items <span className="task-count">{workItems.length}</span>
        </h2>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Use ↑↓ and Enter to navigate</div>
      </div>

      {workItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={48} /></div>
          <div className="empty-state-text">
            No work items found. Try a different search or create a new work item!
          </div>
        </div>
      ) : (
        workItems.map((workItem, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={workItem.id}
              ref={isActive ? activeItemRef : null}
              className="task-card"
              onClick={() => onWorkItemClick && onWorkItemClick(workItem)}
              style={{
                borderLeft: isActive ? '3px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: isActive ? '#f8fafc' : 'white',
                outline: isActive ? '1px solid #e2e8f0' : 'none'
              }}
            >
              <div className="task-header">
                <div>
                  <div className="task-title" style={{ fontWeight: isActive ? '600' : '500' }}>
                    {workItem.title}
                    {workItem.externalId && (
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                        #{workItem.externalId}
                      </span>
                    )}
                  </div>
                  {workItem.description && (
                    <div className="task-description">{workItem.description}</div>
                  )}
                </div>
              </div>

              <div className="task-meta">
                {workItem.priority && (
                  <span
                    className="badge"
                    style={{
                      background: `${getPriorityColor(workItem.priority)}15`,
                      color: getPriorityColor(workItem.priority),
                      border: `1px solid ${getPriorityColor(workItem.priority)}30`
                    }}
                  >
                    {workItem.priority}
                  </span>
                )}

                <span
                  className="badge"
                  style={{
                    background: `${getStatusColor(workItem.status)}15`,
                    color: getStatusColor(workItem.status),
                    border: `1px solid ${getStatusColor(workItem.status)}30`
                  }}
                >
                  {formatStatus(workItem.status)}
                </span>

                {workItem.category && (
                  <span className="badge tag">
                    {workItem.category.name}
                  </span>
                )}

                {workItem.startDate && (
                  <span className="badge" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                    Start: {formatDate(workItem.startDate)}
                  </span>
                )}

                {workItem.dueDate && (
                  <span className="badge" style={{ background: '#fff3e0', color: '#f57c00' }}>
                    Due: {formatDate(workItem.dueDate)}
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

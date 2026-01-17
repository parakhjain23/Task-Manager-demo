'use client';

import { useRef, useEffect } from 'react';

export default function TaskList({ tasks, loading, error, onTaskClick, activeIndex }) {
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="task-list">
        <h2>📋 Tasks</h2>
        <div className="loading">✨ Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list">
        <h2>📋 Tasks</h2>
        <div className="error">⚠️ {error}</div>
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

  return (
    <div className="task-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📋 Tasks <span className="task-count">{tasks.length}</span></h2>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Use ↑↓ and Enter to navigate</div>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">
            No tasks found. Try a different search or create a new task!
          </div>
        </div>
      ) : (
        tasks.map((task, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={task.id}
              ref={isActive ? activeItemRef : null}
              className="task-card"
              onClick={() => onTaskClick && onTaskClick(task)}
              style={{
                borderLeft: isActive ? '3px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: isActive ? '#f8fafc' : 'white',
                outline: isActive ? '1px solid #e2e8f0' : 'none'
              }}
            >
              <div className="task-header">
                <div>
                  <div className="task-title" style={{ fontWeight: isActive ? '600' : '500' }}>{task.title}</div>
                  <div className="task-description">{task.description}</div>
                </div>
              </div>

              <div className="task-meta">
                <span className={`badge priority-${task.priority}`}>
                  {task.priority.toUpperCase()}
                </span>

                <span className={`badge status-${task.status}`}>
                  {task.status.replace('-', ' ').toUpperCase()}
                </span>

                {task.tags && task.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="badge tag">
                    {tag}
                  </span>
                ))}

                {task.assignedTo && (
                  <span className="assignee">
                    {task.assignedTo}
                  </span>
                )}

                {task.dueDate && (
                  <span className="badge" style={{ background: '#fff3e0', color: '#f57c00' }}>
                    Due: {formatDate(task.dueDate)}
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

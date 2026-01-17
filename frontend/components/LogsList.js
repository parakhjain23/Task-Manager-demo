'use client';

import { useRef, useEffect } from 'react';

export default function LogsList({ logs, loading, error, onLogClick, activeIndex }) {
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  if (loading) return <div className="loading">Loading work items...</div>;
  if (error) return <div className="error">{error}</div>;

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString = new Date()) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="task-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Work Items <span className="task-count">{logs.length}</span></h2>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Use ↑↓ and Enter to navigate</div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">No work items found. Use the chat to log your activities!</div>
        </div>
      ) : (
        logs.map((log, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={log.id || index}
              ref={isActive ? activeItemRef : null}
              className="task-card"
              onClick={() => onLogClick && onLogClick(log)}
              style={{
                borderLeft: isActive ? '3px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: isActive ? '#f8fafc' : 'white',
                outline: isActive ? '1px solid #e2e8f0' : 'none'
              }}
            >
              <div className="task-header">
                <div style={{ width: '100%' }}>
                  <div className="log-user-input" style={{ fontSize: '0.95rem', color: '#333' }}>
                    {truncateText(log.userInput, 200)}
                  </div>
                </div>
              </div>

              <div className="task-meta">
                <span className="badge" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                  {formatDate(log.createdAt)}
                </span>

                {log.isTask && log.taskId && (
                  <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                    ✓ Task Created
                  </span>
                )}

                {!log.isClassified && (
                  <span className="badge" style={{ background: '#fff3e0', color: '#f57c00' }}>
                    Analyzing...
                  </span>
                )}

                {log.isClassified && !log.isTask && (
                  <span className="badge" style={{ background: '#f5f5f5', color: '#757575' }}>
                    No Task
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

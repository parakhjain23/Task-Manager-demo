'use client';

export default function LogsList({ logs, loading, error, onLogClick }) {
  if (loading) {
    return (
      <div className="task-list">
        <h2>💬 Work Items</h2>
        <div className="loading">✨ Loading items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list">
        <h2>💬 Work Items</h2>
        <div className="error">⚠️ {error}</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="task-list">
        <h2>💬 Work Items</h2>
        <div className="empty-state">
          <div className="empty-state-icon">💭</div>
          <div className="empty-state-text">
            No items found. Try a different search or start a new conversation!
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="task-list">
      <h2>
        💬 Work Items
        <span className="task-count">{logs.length}</span>
      </h2>
      {logs.map((log) => (
        <div
          key={log.id}
          className="task-card log-card"
          onClick={() => onLogClick && onLogClick(log)}
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
      ))}
    </div>
  );
}

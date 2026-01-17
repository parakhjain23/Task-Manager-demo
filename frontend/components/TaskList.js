'use client';

export default function TaskList({ tasks, loading, error, onTaskClick }) {
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

  if (tasks.length === 0) {
    return (
      <div className="task-list">
        <h2>📋 Tasks</h2>
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">
            No tasks found. Try a different search or create a new task!
          </div>
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

  return (
    <div className="task-list">
      <h2>
        📋 Tasks
        <span className="task-count">{tasks.length}</span>
      </h2>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="task-card"
          onClick={() => onTaskClick && onTaskClick(task)}
        >
          <div className="task-header">
            <div>
              <div className="task-title">{task.title}</div>
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

            {task.tags && task.tags.map((tag, index) => (
              <span key={index} className="badge tag">
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
      ))}
    </div>
  );
}

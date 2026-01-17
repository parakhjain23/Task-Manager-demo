'use client';

import Timeline from './Timeline';

export default function LogDetailsPanel({ log, onClose }) {
    if (!log) return null;

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

    return (
        <>
            <div className="task-details-overlay" onClick={onClose}></div>
            <div className="task-details-panel">
                <div className="task-details-header">
                    <h2 className="task-details-title">Work Item Details</h2>
                    <button onClick={onClose} className="task-details-close">✕</button>
                </div>

                <div className="task-details-content task-details-scrollable">
                    {/* User Input */}
                    <div className="task-detail-section">
                        <label className="task-detail-label">Original Request</label>
                        <div className="task-detail-value task-title-large" style={{ whiteSpace: 'pre-wrap' }}>
                            {log.userInput}
                        </div>
                    </div>

                    {/* AI Response if available */}
                    {log.aiResponse && (
                        <div className="task-detail-section">
                            <label className="task-detail-label">AI Analysis Detail</label>
                            <div className="task-detail-value" style={{
                                padding: '12px',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                borderLeft: '4px solid #6366f1',
                                fontSize: '0.9rem',
                                color: '#444'
                            }}>
                                {log.aiResponse}
                            </div>
                        </div>
                    )}

                    {/* Activity Status */}
                    <div className="task-detail-row">
                        <div className="task-detail-section">
                            <label className="task-detail-label">Status</label>
                            <div className={`task-detail-badge ${log.isClassified ? 'status-completed' : 'status-pending'}`}>
                                {log.isClassified ? 'Analyzed' : 'Processing'}
                            </div>
                        </div>

                        <div className="task-detail-section">
                            <label className="task-detail-label">Action Taken</label>
                            <div className={`task-detail-badge ${log.isTask ? 'status-completed' : 'status-pending'}`}>
                                {log.isTask ? 'Task Created' : (log.isClassified ? 'No Task' : 'Pending')}
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="task-detail-section">
                        <label className="task-detail-label">Captured At</label>
                        <div className="task-detail-value task-date">
                            📅 {formatDate(log.createdAt)}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="task-detail-section" style={{ marginTop: '24px' }}>
                        <label className="task-detail-label">Activity Timeline</label>
                        <Timeline
                            createdAt={log.createdAt}
                            analyzedAt={log.analyzedAt}
                            isClassified={log.isClassified}
                            isTask={log.isTask}
                            taskTitle={log.task?.title}
                        />
                    </div>

                    {log.isTask && log.taskId && (
                        <div className="task-detail-section" style={{ marginTop: '20px' }}>
                            <div style={{
                                padding: '12px',
                                background: '#e8f5e9',
                                borderRadius: '8px',
                                border: '1px solid #c8e6c9',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '20px' }}>✅</span>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#2e7d32', fontSize: '14px' }}>Task Created Successfully</div>
                                    <div style={{ color: '#4caf50', fontSize: '12px' }}>This item has been converted into a task.</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

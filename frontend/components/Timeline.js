import { Circle, CheckCircle2, Search, Zap, PlusCircle, Activity } from 'lucide-react';

export default function Timeline({ createdAt, analyzedAt, isClassified, isTask, taskTitle }) {
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
        <div className="activity-timeline">
            {/* Step 1: Captured */}
            <div className="timeline-item">
                <div className="timeline-dot completed">
                    <PlusCircle size={12} style={{ color: 'white' }} />
                </div>
                <div className="timeline-content">
                    <div className="timeline-label">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={14} /> Entry Captured
                        </span>
                        <span className="timeline-time">{formatDate(createdAt)}</span>
                    </div>
                    <div className="timeline-desc">Initial input received and logged.</div>
                </div>
            </div>

            {/* Step 2: Analysis */}
            <div className={`timeline-item ${!isClassified ? 'pending' : ''}`}>
                <div className={`timeline-dot ${isClassified ? 'completed' : 'pending'}`}>
                    {isClassified ? <CheckCircle2 size={12} style={{ color: 'white' }} /> : <Search size={12} />}
                </div>
                <div className="timeline-content">
                    <div className="timeline-label">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Search size={14} /> AI Intent Analysis
                        </span>
                        {analyzedAt && <span className="timeline-time">{formatDate(analyzedAt)}</span>}
                    </div>
                    <div className="timeline-desc">
                        {isClassified
                            ? 'Natural language processing complete.'
                            : 'AI is currently analyzing the intent...'}
                    </div>
                </div>
            </div>

            {/* Step 3: Execution */}
            {isClassified && (
                <div className="timeline-item">
                    <div className="timeline-dot completed">
                        {isTask ? <Zap size={12} style={{ color: 'white' }} /> : <CheckCircle2 size={12} style={{ color: 'white' }} />}
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-label">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isTask ? <Zap size={14} /> : <CheckCircle2 size={14} />}
                                {isTask ? 'Task Generated' : 'No Action Required'}
                            </span>
                        </div>
                        <div className="timeline-desc">
                            {isTask
                                ? `Successfully created task: "${truncateText(taskTitle || 'New Task', 40)}"`
                                : 'AI determined this request does not require a new task.'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

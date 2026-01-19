'use client';

import { Lightbulb, Check, X, FileText } from 'lucide-react';

export default function IdeasList({ ideas, onApprove, onReject }) {
    return (
        <div className="task-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Lightbulb size={22} className="idea-icon-heading" /> Proposed Ideas <span className="task-count">{ideas.length}</span>
                </h2>
            </div>

            {ideas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><FileText size={48} /></div>
                    <div className="empty-state-text">
                        No pending ideas. You're all caught up!
                    </div>
                </div>
            ) : (
                ideas.map((idea) => (
                    <div
                        key={idea.id}
                        className="task-card idea-card"
                        style={{ cursor: 'default' }}
                    >
                        <div className="task-header" style={{ marginBottom: '0' }}>
                            <div style={{ flex: 1 }}>
                                <div className="task-title" style={{ fontSize: '16px', marginBottom: '4px' }}>{idea.text}</div>
                                <div className="task-description">New proposal for the platform improvement.</div>
                            </div>
                            <div className="idea-card-actions">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onApprove(idea.id); }}
                                    className="idea-action-btn-large approve"
                                    title="Approve Idea"
                                >
                                    <Check size={18} />
                                    <span>Approve</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReject(idea.id); }}
                                    className="idea-action-btn-large reject"
                                    title="Reject Idea"
                                >
                                    <X size={18} />
                                    <span>Reject</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

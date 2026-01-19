'use client';

import { useEffect } from 'react';

export default function ChatbotPanel({ isOpen, itemId, itemDetails, isChatbotReady }) {
    useEffect(() => {
        if (isOpen && isChatbotReady && window.Chatbot) {
            // Send dynamic data at runtime when opening the sidebar
            window.Chatbot.sendData({
                bridgeName: 'task-manager',
                threadId: itemId || 'global_thread',
                parentId: 'chatbot-container-inside-panel',
                fullScreen: true,
                defaultOpen: true,
                hideCloseButton: true,
                hideIcon: true,
                variables: {
                    details: itemDetails || ''
                }
            });
        }
    }, [isOpen, itemId, itemDetails, isChatbotReady]);

    if (!isOpen) return null;

    return (
        <div className="chatbot-panel">
            <div className="chatbot-panel-content" id="chatbot-container-inside-panel">
                {!isChatbotReady && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        <div className="status-indicator" style={{ display: 'inline-block', marginRight: '8px' }}></div>
                        Initializing AI Assistant...
                    </div>
                )}
            </div>
        </div>
    );
}

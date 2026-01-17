'use client';

import { useState, useEffect } from 'react';

export default function Sidebar({ onViewChange, currentView, onCustomViewRequest }) {
  const [showCustomView, setShowCustomView] = useState(false);
  const [viewQuery, setViewQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedViews, setSavedViews] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewToSave, setViewToSave] = useState(null);
  const [saveName, setSaveName] = useState('');

  const menuItems = [
    { id: 'logs', label: 'Work Items', icon: '💬' },
    { id: 'tasks', label: 'All Tasks', icon: '📋' },
    { id: 'pending', label: 'My Pending Tasks', icon: '⏳' },
    { id: 'members', label: 'Team Members', icon: '👥' },
    { id: 'deleted', label: 'Deleted Items', icon: '🗑️' }
  ];

  // Fetch saved views on component mount
  useEffect(() => {
    fetchSavedViews();
  }, []);

  const fetchSavedViews = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/views`);
      const data = await response.json();
      setSavedViews(data);
    } catch (error) {
      console.error('Error fetching saved views:', error);
    }
  };

  const handleSavedViewClick = async (viewId) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/views/${viewId}`);
      const data = await response.json();

      if (response.ok) {
        if (onCustomViewRequest) {
          onCustomViewRequest(data.view?.name || 'Custom View', data.tasks);
        }
      } else {
        alert(data.error || 'Failed to load view');
      }
    } catch (error) {
      console.error('Error loading saved view:', error);
      alert('Failed to load view. Please try again.');
    }
  };

  const handleDeleteView = async (viewId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this view?')) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/views/${viewId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSavedViews();
      }
    } catch (error) {
      console.error('Error deleting view:', error);
      alert('Failed to delete view. Please try again.');
    }
  };

  const handleCustomViewSubmit = async (e) => {
    e.preventDefault();
    if (!viewQuery.trim() || loading) return;

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/dynamic-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: viewQuery,
          currentUser: null
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (onCustomViewRequest) {
          onCustomViewRequest(data.viewName, data.tasks);
        }

        // Ask if user wants to save this view
        setViewToSave({
          name: data.viewName,
          query: viewQuery,
          filters: data.filters
        });
        setShowSaveDialog(true);

        setViewQuery('');
        setShowCustomView(false);
      } else {
        alert(data.error || 'Failed to create custom view');
      }
    } catch (error) {
      console.error('Error creating custom view:', error);
      alert('Failed to create custom view. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveView = async () => {
    if (!saveName.trim() || !viewToSave) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          query: viewToSave.query,
          filters: viewToSave.filters
        })
      });

      if (response.ok) {
        fetchSavedViews();
        setShowSaveDialog(false);
        setSaveName('');
        setViewToSave(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save view');
      }
    } catch (error) {
      console.error('Error saving view:', error);
      alert('Failed to save view. Please try again.');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">IntelliFlow</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}

        <div className="sidebar-divider"></div>

        {/* Saved Views Section */}
        {savedViews.length > 0 && (
          <>
            <div className="sidebar-section-label">Saved Views</div>
            {savedViews.map((view) => (
              <div key={view.id} className="saved-view-item">
                <button
                  onClick={() => handleSavedViewClick(view.id)}
                  className="sidebar-item"
                >
                  <span className="sidebar-item-icon">⭐</span>
                  <span className="sidebar-item-label">{view.name}</span>
                </button>
                <button
                  onClick={(e) => handleDeleteView(view.id, e)}
                  className="delete-view-button"
                  title="Delete view"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="sidebar-divider"></div>
          </>
        )}

        <button
          onClick={() => setShowCustomView(!showCustomView)}
          className={`sidebar-item ${showCustomView ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon">🔍</span>
          <span className="sidebar-item-label">Create Custom View</span>
        </button>

        {showCustomView && (
          <div className="custom-view-form">
            <form onSubmit={handleCustomViewSubmit}>
              <input
                type="text"
                value={viewQuery}
                onChange={(e) => setViewQuery(e.target.value)}
                placeholder="e.g., pending tasks from this week"
                className="custom-view-input"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                className="custom-view-button"
                disabled={loading || !viewQuery.trim()}
              >
                {loading ? 'Creating...' : 'Apply'}
              </button>
            </form>
            <div className="custom-view-examples">
              <div className="examples-label">Examples:</div>
              <button
                type="button"
                onClick={() => setViewQuery('pending tasks created today')}
                className="example-button"
              >
                Tasks created today
              </button>
              <button
                type="button"
                onClick={() => setViewQuery('high priority tasks')}
                className="example-button"
              >
                High priority tasks
              </button>
              <button
                type="button"
                onClick={() => setViewQuery('tasks due this week')}
                className="example-button"
              >
                Due this week
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-label">AI Assistant</div>
          <div className="sidebar-footer-status">
            <span className="status-indicator"></span>
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Save View Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="save-dialog-title">Save this view?</h3>
            <p className="save-dialog-subtitle">Give your view a name to access it quickly later</p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={viewToSave?.name || "Enter view name"}
              className="save-dialog-input"
              autoFocus
            />
            <div className="save-dialog-actions">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveName('');
                  setViewToSave(null);
                }}
                className="save-dialog-button secondary"
              >
                Skip
              </button>
              <button
                onClick={handleSaveView}
                disabled={!saveName.trim()}
                className="save-dialog-button primary"
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

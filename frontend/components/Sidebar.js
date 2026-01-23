'use client';

import {
  ClipboardList,
  Lightbulb,
  MessageSquare,
  Folder,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({
  onViewChange,
  currentView,
  categories,
  selectedCategory,
  onCategoryChange,
  onCreateCategory
}) {
  const [showCategories, setShowCategories] = useState(true);

  const menuItems = [
    { id: 'work-items', label: 'All Work Items', icon: <ClipboardList size={18} /> },
    { id: 'logs', label: 'Activity Logs', icon: <MessageSquare size={18} /> },
    { id: 'ideas', label: 'Proposed Ideas', icon: <Lightbulb size={18} /> }
  ];

  const handleCategoryClick = (categoryId) => {
    // Switch to work-items view and select the category
    onViewChange('work-items');
    onCategoryChange(categoryId);
  };

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-log mb-4">
          <div style={{ fontSize: '20px', fontWeight: '700' }}>Work Manager</div>
        </div>
        {/* Main Menu Items */}
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${currentView === item.id && !selectedCategory ? 'active' : ''}`}
            onClick={() => {
              onViewChange(item.id);
              if (item.id === 'work-items') {
                onCategoryChange(null); // Show all work items
              }
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}

        {/* Divider */}
        <div style={{
          height: '1px',
          background: '#e2e8f0',
          margin: '16px 0'
        }}></div>

        {/* Categories Section */}
        <div>
          <div
            className="sidebar-section-header"
            onClick={() => setShowCategories(!showCategories)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={14} />
              <span>Categories</span>
            </div>
            {showCategories ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {showCategories && (
            <>
              {/* Create Category Button */}
              <div
                onClick={onCreateCategory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  margin: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px dashed #93c5fd',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dbeafe';
                  e.currentTarget.style.borderColor = '#60a5fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                  e.currentTarget.style.borderColor = '#93c5fd';
                }}
              >
                <Plus size={16} />
                <span>New Category</span>
              </div>

              {/* Categories List */}
              {categories && categories.length > 0 ? (
                categories.map(category => (
                  <div
                    key={category.id}
                    className={`sidebar-item ${currentView === 'work-items' && selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(category.id)}
                    style={{
                      paddingLeft: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <Folder size={16} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {category.name}
                    </span>
                    {category._count && category._count.workItems > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: currentView === 'work-items' && selectedCategory === category.id ? '#3b82f6' : '#f1f5f9',
                          color: currentView === 'work-items' && selectedCategory === category.id ? 'white' : '#64748b',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontWeight: '600',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}
                      >
                        {category._count.workItems}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#94a3b8',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  No categories yet
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        padding: '16px',
        fontSize: '11px',
        color: '#94a3b8',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div>Work Items Architecture v2.0</div>
        <div style={{ marginTop: '4px' }}>
          Press <kbd style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '3px', fontSize: '10px' }}>?</kbd> for shortcuts
        </div>
      </div>
    </div>
  );
}

'use client';

import { Filter, Folder, Plus } from 'lucide-react';

export default function FilterBar({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onCreateCategory
}) {
  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'CAPTURED', label: 'Captured' },
    { value: 'CLARIFYING', label: 'Clarifying' },
    { value: 'THINKING', label: 'Thinking' },
    { value: 'DECIDED', label: 'Decided' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '16px 20px',
      background: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
        <Filter size={16} />
        <span>Filters:</span>
      </div>

      {/* Category Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          value={selectedCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            outline: 'none',
            minWidth: '150px'
          }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={onCreateCategory}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#2563eb',
            fontWeight: '500'
          }}
          title="Create new category"
        >
          <Plus size={16} />
          Category
        </button>
      </div>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          background: 'white',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {statuses.map(status => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      {/* Priority Filter */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          background: 'white',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {priorities.map(priority => (
          <option key={priority.value} value={priority.value}>
            {priority.label}
          </option>
        ))}
      </select>

      {/* Active Filters Indicator */}
      {(statusFilter !== 'all' || priorityFilter !== 'all' || selectedCategory) && (
        <button
          onClick={() => {
            onStatusChange('all');
            onPriorityChange('all');
            onCategoryChange(null);
          }}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            background: '#fee2e2',
            color: '#dc2626',
            cursor: 'pointer',
            fontWeight: '500',
            marginLeft: 'auto'
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

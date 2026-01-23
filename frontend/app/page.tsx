'use client';

import { useState, useEffect } from 'react';
import { Search, X, SendHorizontal, Loader2, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import WorkItemList from '../components/WorkItemList';
import LogsList from '../components/LogsList';
import WorkItemDetailsPanel from '../components/WorkItemDetailsPanel';
import LogDetailsPanel from '../components/LogDetailsPanel';
import ChatbotPanel from '../components/ChatbotPanel';
import IdeasList from '../components/IdeasList';
import FilterBar from '../components/FilterBar';
import CreateCategoryModal from '../components/CreateCategoryModal';
import './globals.css';
import { WorkItem, Log, Category, Idea, ViewType } from '../types';

export default function Home() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('work-items');
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const [workItemInput, setWorkItemInput] = useState<string>('');
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [chatbotToken, setChatbotToken] = useState<string | null>(null);
  const [chatbotReady, setChatbotReady] = useState<boolean>(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateCategory, setShowCreateCategory] = useState<boolean>(false);

  // Assume orgId is passed from authentication or environment
  const orgId = process.env.NEXT_PUBLIC_ORG_ID || '1';
  const userId = process.env.NEXT_PUBLIC_USER_ID || '1'; // For createdBy

  const [ideas, setIdeas] = useState<Idea[]>([
    { id: 1, text: 'Implementation of dark mode' },
    { id: 2, text: 'Add real-time notifications' },
    { id: 3, text: 'Mobile app version' }
  ]);

  const handleApproveIdea = (id: number) => {
    setIdeas(prev => prev.filter(idea => idea.id !== id));
  };

  const handleRejectIdea = (id: number) => {
    setIdeas(prev => prev.filter(idea => idea.id !== id));
  };

  // Fetch categories for the organization
  const fetchCategories = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/categories/org/${orgId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);

      // Auto-select first category if none selected
      if (!selectedCategory && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchWorkItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

      // Build query params
      const params = new URLSearchParams();
      params.append('orgId', orgId);
      if (selectedCategory) {
        params.append('categoryId', selectedCategory);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${API_URL}/work-items?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch work items');
      }

      const data = await response.json();
      setWorkItems(data.workItems || data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching work items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

      // If category is selected, fetch logs for that category
      let url = `${API_URL}/work-item-logs/type/ai_analysis`;
      if (selectedCategory) {
        url = `${API_URL}/work-item-logs/category/${selectedCategory}/timeline`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching logs:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch data when view, category, or filters change
  useEffect(() => {
    if (currentView === 'logs') {
      fetchLogs(true);
      // Poll for updates every 5 seconds without showing loading state
      const interval = setInterval(() => fetchLogs(false), 5000);
      return () => clearInterval(interval);
    } else if (currentView === 'work-items') {
      fetchWorkItems();
    }
  }, [currentView, selectedCategory, statusFilter, priorityFilter, searchQuery]);

  // Global Chatbot initialization
  useEffect(() => {
    const initChatbot = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL}/utility/generate-chatbot-token`);
        if (response.ok) {
          const data = await response.json();
          setChatbotToken(data.token);

          // Inject script once token is available
          if (!document.getElementById('chatbot-main-script')) {
            const script = document.createElement('script');
            script.id = 'chatbot-main-script';
            script.src = 'https://chatbot-embed.viasocket.com/chatbot-prod.js';
            script.setAttribute('embedToken', data.token);
            script.setAttribute('bridgeName', 'task-manager');
            script.setAttribute('hideIcon', 'true');
            script.onload = () => setChatbotReady(true);
            document.body.appendChild(script);
          }
        }
      } catch (error) {
        console.error('Error initializing global chatbot:', error);
      }
    };

    initChatbot();
  }, []);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setSearchQuery('');
    // Reset filters when changing views (but not categories)
    if (view !== 'work-items') {
      setStatusFilter('all');
      setPriorityFilter('all');
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleWorkItemClick = (workItem: WorkItem) => {
    setSelectedWorkItem(workItem);
  };

  const handleLogClick = (log: Log) => {
    setSelectedLog(log);
  };

  const handleWorkItemUpdate = (updatedWorkItem: WorkItem, isDeleted = false) => {
    if (isDeleted) {
      // Remove deleted work item
      setWorkItems(prev => prev.filter(wi => wi.id !== selectedWorkItem?.id));
      setSelectedWorkItem(null);
    } else if (updatedWorkItem) {
      // Update the work item in the list
      setWorkItems(prev => prev.map(wi => wi.id === updatedWorkItem.id ? updatedWorkItem : wi));
      setSelectedWorkItem(updatedWorkItem);
    }
  };

  const handleCreateWorkItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workItemInput.trim() || createLoading) return;

    if (!selectedCategory) {
      alert('Please select a category first');
      return;
    }

    const title = workItemInput.trim();
    setWorkItemInput('');
    setCreateLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/work-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory,
          title: title,
          description: '',
          status: 'CAPTURED',
          createdBy: userId
        })
      });

      if (response.ok) {
        const newWorkItem = await response.json();
        setWorkItems(prev => [newWorkItem, ...prev]);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create work item');
      }
    } catch (error) {
      console.error('Error creating work item:', error);
      alert('Failed to create work item. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [newCategory, ...prev]);
    setSelectedCategory(newCategory.id);
    setShowCreateCategory(false);
  };

  const filteredWorkItems = workItems;

  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    return log.message?.toLowerCase().includes(searchLower) ||
      log.workItem?.title?.toLowerCase().includes(searchLower);
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedLog || selectedWorkItem) {
          setSelectedLog(null);
          setSelectedWorkItem(null);
          return;
        }
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          (document.activeElement as HTMLElement).blur();
          return;
        }
      }

      // Don't navigate if user is typing in an input or textarea
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      const items = currentView === 'logs' ? filteredLogs : filteredWorkItems;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < items.length) {
          const selectedItem = items[activeIndex];
          if (currentView === 'logs') {
            handleLogClick(selectedItem as Log);
          } else {
            handleWorkItemClick(selectedItem as WorkItem);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, filteredLogs, filteredWorkItems, activeIndex, selectedLog, selectedWorkItem]);

  const renderContent = () => {
    if (currentView === 'ideas') {
      return (
        <IdeasList
          ideas={ideas}
          onApprove={handleApproveIdea}
          onReject={handleRejectIdea}
        />
      );
    }

    if (currentView === 'logs') {
      return (
        <LogsList
          logs={filteredLogs}
          loading={loading}
          error={error}
          onLogClick={handleLogClick}
          activeIndex={activeIndex}
        />
      );
    }

    return (
      <>
        <FilterBar
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          onCreateCategory={() => setShowCreateCategory(true)}
        />
        <WorkItemList
          workItems={filteredWorkItems}
          loading={loading}
          error={error}
          onWorkItemClick={handleWorkItemClick}
          activeIndex={activeIndex}
        />
      </>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        onCreateCategory={() => setShowCreateCategory(true)}
      />

      <div className="container">
        <div className="app-header">
          <div className="app-title">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1>
                {currentView === 'logs' && 'Activity Logs'}
                {currentView === 'work-items' && 'Work Items'}
                {currentView === 'ideas' && 'Proposed Ideas'}
              </h1>
              {selectedCategory && categories.length > 0 && currentView === 'work-items' && (
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '400', marginTop: '4px' }}>
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
            </div>
          </div>

          {currentView === 'work-items' && (
            <div className="search-container">
              <span className="search-icon"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Search work items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {currentView === 'logs' && (
            <div className="search-container">
              <span className="search-icon"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <div className="header-badge">
            AI Assistant
          </div>
        </div>

        {renderContent()}

        {/* Bottom Input - Work Items view */}
        {currentView === 'work-items' && (
          <div className="bottom-chatbot-container">
            <form onSubmit={handleCreateWorkItem} className="bottom-chatbot-form">
              <input
                type="text"
                value={workItemInput}
                onChange={(e) => setWorkItemInput(e.target.value)}
                placeholder="Create a work item..."
                className="bottom-chatbot-input"
                disabled={createLoading || !selectedCategory}
              />
              <button
                type="submit"
                disabled={createLoading || !workItemInput.trim() || !selectedCategory}
                className="bottom-chatbot-send-button"
              >
                {createLoading ? <Loader2 className="animate-spin" size={20} /> : <SendHorizontal size={20} />}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Panels Overlay */}
      {(selectedWorkItem || selectedLog) && (
        <div
          className="task-details-overlay"
          onClick={() => {
            setSelectedWorkItem(null);
            setSelectedLog(null);
          }}
        ></div>
      )}

      {/* Work Item Details Panel */}
      {selectedWorkItem && (
        <>
          <ChatbotPanel
            isOpen={!!selectedWorkItem}
            onClose={() => setSelectedWorkItem(null)}
            itemId={selectedWorkItem.id}
            itemDetails={selectedWorkItem}
            itemTitle={selectedWorkItem.title}
            isChatbotReady={chatbotReady}
          />
          <WorkItemDetailsPanel
            workItem={selectedWorkItem}
            onClose={() => setSelectedWorkItem(null)}
            onUpdate={handleWorkItemUpdate}
          />
        </>
      )}

      {/* Log Details Panel */}
      {selectedLog && (
        <>
          <ChatbotPanel
            isOpen={!!selectedLog}
            onClose={() => setSelectedLog(null)}
            itemId={selectedLog.id}
            itemDetails={selectedLog}
            itemTitle={selectedLog.message?.substring(0, 30) + '...'}
            isChatbotReady={chatbotReady}
          />
          <LogDetailsPanel
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        </>
      )}

      {/* Create Category Modal */}
      {showCreateCategory && (
        <CreateCategoryModal
          orgId={orgId}
          userId={userId}
          onClose={() => setShowCreateCategory(false)}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </div>
  );
}

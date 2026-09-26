import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi, clientsApi } from '../api';
import { Post, Client, Platform, PostStatus, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import { KanbanBoard } from '../components/posts/KanbanBoard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  Filter,
  Plus,
  RefreshCw,
  Search,
  Building2,
  Share2,
} from 'lucide-react';
import { Dropdown } from '../components/common/Dropdown';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    }
  };

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const filters: any = {};
      if (selectedClient) filters.client = selectedClient;
      if (selectedPlatform) filters.platform = selectedPlatform;

      const data = await postsApi.getAll(filters);
      setPosts(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to retrieve campaign posts';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedClient, selectedPlatform]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Client-side text and status filter
  const filteredPosts = posts.filter((p) => {
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const captionMatch = p.caption.toLowerCase().includes(q);
    const clientMatch = p.client?.brandName?.toLowerCase().includes(q);
    const creatorMatch = p.createdBy?.name?.toLowerCase().includes(q);
    return captionMatch || clientMatch || creatorMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Content Approval Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, review, and schedule social media campaigns across client brands
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPosts(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition disabled:opacity-50"
            title="Refresh board"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {user?.role === Role.CREATOR && (
            <button
              onClick={() => navigate('/posts/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar matching image.png */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input (Pill) */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts or creators..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition bg-white"
            />
          </div>

          {/* Platform Filter Dropdown (Type) */}
          <Dropdown
            label="Type"
            value={selectedPlatform}
            onChange={setSelectedPlatform}
            options={[
              { value: '', label: 'Any' },
              ...Object.values(Platform).map((plat) => ({ value: plat, label: plat })),
            ]}
          />

          {/* Client Filter Dropdown (Category) */}
          <Dropdown
            label="Category"
            value={selectedClient}
            onChange={setSelectedClient}
            options={[
              { value: '', label: 'Any' },
              ...clients.map((c) => ({ value: c._id, label: c.brandName })),
            ]}
          />

          {/* Status Filter Dropdown */}
          <Dropdown
            label="Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: '', label: 'Any' },
              { value: PostStatus.DRAFT, label: 'Draft' },
              { value: PostStatus.IN_REVIEW, label: 'In Review' },
              { value: PostStatus.APPROVED, label: 'Approved' },
              { value: PostStatus.CHANGES_REQUESTED, label: 'Changes Requested' },
              { value: PostStatus.SCHEDULED, label: 'Scheduled' },
              { value: PostStatus.PUBLISHED, label: 'Published' },
            ]}
          />

          {(selectedClient || selectedPlatform || selectedStatus || searchQuery) && (
            <button
              onClick={() => {
                setSelectedClient('');
                setSelectedPlatform('');
                setSelectedStatus('');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 rounded-full hover:bg-blue-50 transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Counter summary */}
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredPosts.length}</span> post(s)
        </div>
      </div>

      {/* Board Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading posts into workflow board..." />
      ) : error ? (
        <ErrorMessage
          title="Could not load campaign board"
          message={error}
          onRetry={() => fetchPosts()}
        />
      ) : (
        <KanbanBoard posts={filteredPosts} />
      )}
    </div>
  );
};

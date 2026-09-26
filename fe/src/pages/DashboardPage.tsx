import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi, clientsApi } from '../api';
import { Post, Client, Platform, Role } from '../types';
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

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
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

  // Client-side text filter by caption or creator name
  const filteredPosts = posts.filter((p) => {
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

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts or creators..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
          </div>

          {/* Client Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="py-1.5 pl-2.5 pr-8 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition"
            >
              <option value="">All Client Brands</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.brandName}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="py-1.5 pl-2.5 pr-8 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition"
            >
              <option value="">All Platforms</option>
              {Object.values(Platform).map((plat) => (
                <option key={plat} value={plat}>
                  {plat}
                </option>
              ))}
            </select>
          </div>

          {(selectedClient || selectedPlatform || searchQuery) && (
            <button
              onClick={() => {
                setSelectedClient('');
                setSelectedPlatform('');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
            >
              Reset Filters
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

import React, { useState, useEffect } from 'react';
import { clientsApi, usersApi } from '../api';
import { Client, User, Role } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  Building2,
  Plus,
  UserPlus,
  Trash2,
  UserX,
  Shield,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Dropdown } from '../components/common/Dropdown';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const [assigningClientId, setAssigningClientId] = useState<string | null>(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clientsList, usersList] = await Promise.all([
        clientsApi.getAll(),
        usersApi.getAll(),
      ]);
      setClients(clientsList);
      setReviewers(usersList.filter((u) => u.role === Role.REVIEWER));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load client brands');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    try {
      const created = await clientsApi.create({ brandName: newBrandName.trim() });
      toast.success(`Client brand "${created.brandName}" created!`);
      setClients((prev) => [...prev, created]);
      setShowCreateModal(false);
      setNewBrandName('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create client brand');
    }
  };

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningClientId || !selectedReviewerId) return;

    try {
      const updated = await clientsApi.assignReviewer(assigningClientId, {
        reviewerId: selectedReviewerId,
      });
      toast.success('Reviewer assigned successfully!');
      setClients((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      setAssigningClientId(null);
      setSelectedReviewerId('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign reviewer');
    }
  };

  const handleRemoveReviewer = async (clientId: string, reviewerId: string) => {
    if (!confirm('Remove this reviewer from the client brand?')) return;
    try {
      const updated = await clientsApi.removeReviewer(clientId, reviewerId);
      toast.success('Reviewer removed from brand');
      setClients((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove reviewer');
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete "${client.brandName}"?`)) return;
    try {
      await clientsApi.remove(client._id);
      toast.success(`Client "${client.brandName}" deleted`);
      setClients((prev) => prev.filter((c) => c._id !== client._id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading client accounts and reviewer assignments..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Client Brands Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer media agency client accounts and designate assigned reviewers
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Brand</span>
        </button>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client) => (
          <div
            key={client._id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                  {client.brandName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{client.brandName}</h3>
                  <div className="text-[11px] text-slate-400">ID: {client._id.slice(-6)}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAssigningClientId(client._id)}
                  title="Assign Reviewer"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClient(client)}
                  title="Delete Client"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Assigned Reviewers List */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Assigned Reviewers ({client.reviewers?.length || 0})</span>
                <span className="text-[10px] lowercase text-slate-400">authorized to review</span>
              </div>

              {!client.reviewers || client.reviewers.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-1">
                  No reviewers assigned yet. Click + to assign.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {client.reviewers.map((rev) => (
                    <div
                      key={rev._id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                          {rev.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{rev.name}</span>
                        <span className="text-[10px] text-slate-400">({rev.email})</span>
                      </div>

                      <button
                        onClick={() => handleRemoveReviewer(client._id, rev._id)}
                        title="Remove Reviewer"
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Client */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateClient}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">Add New Client Brand</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="e.g. Kaveri Precision Engineering"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Create Brand
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Assign Reviewer */}
      {assigningClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAssignReviewer}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">Assign Reviewer to Brand</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Team Reviewer
              </label>
              <Dropdown
                variant="form"
                placeholder="Choose reviewer..."
                value={selectedReviewerId}
                onChange={(val) => setSelectedReviewerId(val)}
                options={reviewers.map((rev) => ({
                  value: rev._id,
                  label: rev.name,
                  sublabel: rev.email,
                }))}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssigningClientId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedReviewerId}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

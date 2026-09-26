import React, { useState, useEffect } from 'react';
import { usersApi } from '../api';
import { User, Role } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { formatToIST } from '../utils/dateUtils';
import {
  Users2,
  Plus,
  Shield,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Dropdown } from '../components/common/Dropdown';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.CREATOR,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await usersApi.getAll();
      setUsers(list);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: Role.CREATOR,
    });
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUserId(u._id);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        const updatePayload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        const updated = await usersApi.update(editingUserId, updatePayload);
        toast.success(`User "${updated.name}" updated!`);
        setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      } else {
        const created = await usersApi.create({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        });
        toast.success(`User "${created.name}" created!`);
        setUsers((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`Are you sure you want to delete user "${u.name}"?`)) return;
    try {
      await usersApi.remove(u._id);
      toast.success(`User "${u.name}" deleted`);
      setUsers((prev) => prev.filter((item) => item._id !== u._id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-3 h-3 text-rose-600" /> Admin
          </span>
        );
      case Role.CREATOR:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Creator
          </span>
        );
      case Role.REVIEWER:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reviewer
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading team members and role credentials..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchUsers} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-600" />
            <span>Team Users & RBAC Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer agency staff roles: Admins, Content Creators, and Brand Reviewers
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Created (IST)</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                        {u.name ? u.name.charAt(0) : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5">{getRoleBadge(u.role)}</td>
                  <td className="py-3 px-5 text-slate-500">{formatToIST(u.createdAt)}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        title="Edit User"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Delete User"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleFormSubmit}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">
              {editingUserId ? 'Edit User Profile' : 'Register New Team Member'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Karthik Subramaniam"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="karthik@concepsmedia.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password {editingUserId && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                required={!editingUserId}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
              <Dropdown
                variant="form"
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: val as Role })}
                options={[
                  { value: Role.CREATOR, label: 'CREATOR', sublabel: 'Creates and edits draft posts' },
                  { value: Role.REVIEWER, label: 'REVIEWER', sublabel: 'Approves or requests post changes' },
                  { value: Role.ADMIN, label: 'ADMIN', sublabel: 'Full platform management' },
                ]}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {editingUserId ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

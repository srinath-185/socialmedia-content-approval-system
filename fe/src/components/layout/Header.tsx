import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import { LogOut, User as UserIcon, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case Role.ADMIN:
        return {
          label: 'Admin',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <Shield className="w-3.5 h-3.5 text-rose-600" />,
        };
      case Role.CREATOR:
        return {
          label: 'Creator',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case Role.REVIEWER:
        return {
          label: 'Reviewer',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      default:
        return {
          label: 'User',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <UserIcon className="w-3.5 h-3.5" />,
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Media Workflow Suite
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 leading-tight">
                {user.name}
              </div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleInfo.badgeClass}`}
            >
              {roleInfo.icon}
              <span>{roleInfo.label}</span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

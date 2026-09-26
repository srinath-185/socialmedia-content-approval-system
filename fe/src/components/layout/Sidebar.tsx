import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import {
  Kanban,
  PenSquare,
  Building2,
  Users2,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="text-base font-bold text-slate-900 leading-tight tracking-tight">
            Conceps Media
          </div>
          <div className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase">
            Content Approval
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workflow
            </div>
            <nav className="space-y-1">
              <NavLink to="/" end className={getNavLinkClass}>
                <Kanban className="w-4 h-4" />
                <span>Approval Board</span>
              </NavLink>

              {user?.role === Role.CREATOR && (
                <NavLink to="/posts/new" className={getNavLinkClass}>
                  <PenSquare className="w-4 h-4" />
                  <span>Draft New Post</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Admin Management Navigation */}
          {user?.role === Role.ADMIN && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Administration
              </div>
              <nav className="space-y-1">
                <NavLink to="/clients" className={getNavLinkClass}>
                  <Building2 className="w-4 h-4" />
                  <span>Client Brands</span>
                </NavLink>

                <NavLink to="/users" className={getNavLinkClass}>
                  <Users2 className="w-4 h-4" />
                  <span>Users & Access</span>
                </NavLink>
              </nav>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
          <div className="text-xs font-semibold text-slate-700">Campaign Workflow</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated Publishing Engine</div>
        </div>
      </div>
    </aside>
  );
};

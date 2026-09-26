import React from 'react';
import { AuditLog } from '../../types';
import { formatToIST } from '../../utils/dateUtils';
import { STATUS_UI } from '../../utils/statusColors';
import { ArrowRight, Bot, Clock, UserCheck } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
        No transition history recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {logs.map((log) => {
        const fromUI = (STATUS_UI as any)[log.fromStatus] || {
          label: log.fromStatus === 'NONE' ? 'Created' : log.fromStatus,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          borderColor: 'border-slate-200',
        };

        const toUI = (STATUS_UI as any)[log.toStatus] || {
          label: log.toStatus,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          borderColor: 'border-slate-200',
        };

        const isSystem = log.actor === 'SYSTEM' || log.actorInfo?.role === 'SYSTEM';

        return (
          <div key={log._id} className="relative group">
            {/* Timeline Dot Icon */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs">
              {isSystem ? (
                <Bot className="w-2.5 h-2.5 text-indigo-600" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2">
              {/* Transition Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${fromUI.bgColor} ${fromUI.textColor} ${fromUI.borderColor}`}
                >
                  {fromUI.label}
                </span>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${toUI.bgColor} ${toUI.textColor} ${toUI.borderColor}`}
                >
                  {toUI.label}
                </span>
              </div>

              {/* Actor and Timestamp */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  {isSystem ? (
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> Automated Publishing Job
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      {log.actorInfo?.name || 'Authorized User'}
                    </span>
                  )}
                  {log.actorInfo?.role && log.actorInfo.role !== 'SYSTEM' && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({log.actorInfo.role})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatToIST(log.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

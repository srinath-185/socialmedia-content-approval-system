import React, { useState, useEffect } from 'react';
import { Client, Platform, Post } from '../../types';
import { CAPTION_LIMITS, PLATFORM_CONFIGS } from '../../utils/platformLimits';
import { AlertTriangle, Clock, Calendar, Check, Save } from 'lucide-react';
import { Dropdown } from '../common/Dropdown';
import { DatePicker } from '../common/DatePicker';
import { TimePicker } from '../common/TimePicker';
import {
  getISTParts,
  combineDateAndTimeIST,
  formatToIST,
} from '../../utils/dateUtils';

interface PostEditorProps {
  initialPost?: Post;
  clients: Client[];
  onSubmit: (formData: {
    client: string;
    platform: Platform;
    caption: string;
    scheduledAt?: string;
    version?: number;
  }) => Promise<void>;
  onCaptionChange?: (caption: string) => void;
  onPlatformChange?: (platform: Platform) => void;
  onClientChange?: (clientId: string) => void;
  onDateChange?: (date?: string) => void;
  isSubmitting?: boolean;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  initialPost,
  clients,
  onSubmit,
  onCaptionChange,
  onPlatformChange,
  onClientChange,
  onDateChange,
  isSubmitting = false,
}) => {
  const [selectedClient, setSelectedClient] = useState<string>(
    initialPost?.client?._id || (clients[0]?._id ?? ''),
  );
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    initialPost?.platform || Platform.INSTAGRAM,
  );
  const [caption, setCaption] = useState<string>(initialPost?.caption || '');

  // Separated Date (YYYY-MM-DD) and Time (HH:mm) in IST
  const initialParts = initialPost?.scheduledAt ? getISTParts(initialPost.scheduledAt) : null;
  const [scheduledDate, setScheduledDate] = useState<string | undefined>(
    initialParts?.dateStr || undefined,
  );
  const [scheduledTime, setScheduledTime] = useState<string | undefined>(
    initialParts?.timeStr || undefined,
  );

  useEffect(() => {
    if (initialPost?.scheduledAt) {
      const parts = getISTParts(initialPost.scheduledAt);
      if (parts) {
        setScheduledDate(parts.dateStr);
        setScheduledTime(parts.timeStr);
      }
    }
  }, [initialPost?.scheduledAt]);

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      const defaultId = clients[0]._id;
      setSelectedClient(defaultId);
      onClientChange?.(defaultId);
    }
  }, [clients, selectedClient, onClientChange]);

  const maxLimit = CAPTION_LIMITS[selectedPlatform] || 2200;
  const currentCount = caption.length;
  const isOverLimit = currentCount > maxLimit;
  const percentage = Math.min((currentCount / maxLimit) * 100, 100);

  // Counter badge color
  let counterColorClass = 'text-slate-500';
  let progressBarClass = 'bg-indigo-600';

  if (percentage >= 100) {
    counterColorClass = 'text-rose-600 font-bold';
    progressBarClass = 'bg-rose-600';
  } else if (percentage >= 80) {
    counterColorClass = 'text-amber-600 font-semibold';
    progressBarClass = 'bg-amber-500';
  }

  const handlePlatformSelect = (plat: Platform) => {
    setSelectedPlatform(plat);
    onPlatformChange?.(plat);
  };

  const handleCaptionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCaption(val);
    onCaptionChange?.(val);
  };

  const handleClientSelect = (val: string) => {
    setSelectedClient(val);
    onClientChange?.(val);
  };

  const handleDateSelect = (dateStr?: string) => {
    setScheduledDate(dateStr);
    const effectiveTime = dateStr ? (scheduledTime || '09:00') : undefined;
    if (dateStr && !scheduledTime) {
      setScheduledTime('09:00');
    }
    const combinedISO = combineDateAndTimeIST(dateStr, effectiveTime);
    onDateChange?.(combinedISO);
  };

  const handleTimeSelect = (timeStr?: string) => {
    setScheduledTime(timeStr);
    let effectiveDate = scheduledDate;
    if (timeStr && !effectiveDate) {
      const today = new Date();
      effectiveDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate(),
      ).padStart(2, '0')}`;
      setScheduledDate(effectiveDate);
    }
    const combinedISO = combineDateAndTimeIST(effectiveDate, timeStr);
    onDateChange?.(combinedISO);
  };

  const handleClearSchedule = () => {
    setScheduledDate(undefined);
    setScheduledTime(undefined);
    onDateChange?.(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) return;

    let isoDate: string | undefined = undefined;
    if (scheduledDate) {
      isoDate = combineDateAndTimeIST(scheduledDate, scheduledTime);
    }

    await onSubmit({
      client: selectedClient,
      platform: selectedPlatform,
      caption: caption.trim(),
      scheduledAt: isoDate,
      version: initialPost?.version,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Brand Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Client Brand <span className="text-rose-500">*</span>
        </label>
        <Dropdown
          variant="form"
          placeholder="Select target client brand"
          value={selectedClient}
          onChange={handleClientSelect}
          disabled={!!initialPost}
          options={clients.map((c) => ({
            value: c._id,
            label: c.brandName,
          }))}
          className="w-full"
        />
      </div>

      {/* Target Platform Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Social Media Platform <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(Platform).map((plat) => {
            const config = PLATFORM_CONFIGS[plat];
            const isSelected = selectedPlatform === plat;
            return (
              <button
                key={plat}
                type="button"
                onClick={() => handlePlatformSelect(plat)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caption Textarea with live character counter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Caption & Copy <span className="text-rose-500">*</span>
          </label>
          <div className={`text-xs ${counterColorClass}`}>
            <span>{currentCount}</span> / <span>{maxLimit}</span> chars
          </div>
        </div>

        <textarea
          rows={6}
          value={caption}
          onChange={handleCaptionInput}
          placeholder="Compose high-impact creative caption..."
          className={`w-full p-3.5 rounded-xl border text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 transition leading-relaxed ${
            isOverLimit
              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-200 focus:ring-indigo-600'
          }`}
          required
        />

        {/* Progress bar visual */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${progressBarClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {isOverLimit && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Caption exceeds {PLATFORM_CONFIGS[selectedPlatform].label} character limit by{' '}
              {currentCount - maxLimit} characters.
            </span>
          </div>
        )}
      </div>

      {/* Target Publication Schedule - Separated Date & Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Target Publication Schedule (IST)</span>
          </label>
          {scheduledDate ? (
            <button
              type="button"
              onClick={handleClearSchedule}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
            >
              Clear Schedule
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">Optional for Drafts</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Target Date */}
          <div>
            <span className="block text-[11px] font-medium text-slate-500 mb-1">
              Publication Date
            </span>
            <DatePicker
              value={scheduledDate}
              onChange={handleDateSelect}
              placement="top"
              placeholder="Select date (IST)..."
            />
          </div>

          {/* Target Time */}
          <div>
            <span className="block text-[11px] font-medium text-slate-500 mb-1">
              Publication Time (IST)
            </span>
            <TimePicker
              value={scheduledTime}
              onChange={handleTimeSelect}
              placement="top"
              placeholder="Select time (IST)..."
            />
          </div>
        </div>

        {/* Schedule Summary Banner */}
        {scheduledDate && scheduledTime ? (
          <div className="mt-2 py-2 px-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Scheduled for:{' '}
                <strong>
                  {formatToIST(combineDateAndTimeIST(scheduledDate, scheduledTime))}
                </strong>
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              IST Zone
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 mt-1">
            Times are converted to UTC for database storage and must be in the future.
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isOverLimit || !caption.trim()}
        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        <span>
          {isSubmitting
            ? 'Saving Post...'
            : initialPost
            ? `Update Post (v${initialPost.version})`
            : 'Save as Draft'}
        </span>
      </button>
    </form>
  );
};

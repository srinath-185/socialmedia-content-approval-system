import React, { useState, useEffect } from 'react';
import { Client, Platform, Post } from '../../types';
import { CAPTION_LIMITS, PLATFORM_CONFIGS } from '../../utils/platformLimits';
import { toLocalDatetimeInput } from '../../utils/dateUtils';
import { AlertTriangle, Clock, Calendar, Check, Save } from 'lucide-react';

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
  const [scheduledAtInput, setScheduledAtInput] = useState<string>(
    toLocalDatetimeInput(initialPost?.scheduledAt),
  );

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

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClient(val);
    onClientChange?.(val);
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setScheduledAtInput(val);
    if (val) {
      const iso = new Date(val).toISOString();
      onDateChange?.(iso);
    } else {
      onDateChange?.(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) return;

    let isoDate: string | undefined = undefined;
    if (scheduledAtInput) {
      isoDate = new Date(scheduledAtInput).toISOString();
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
        <select
          value={selectedClient}
          onChange={handleClientSelect}
          disabled={!!initialPost} // Client brand is immutable after post creation
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition disabled:bg-slate-50 disabled:text-slate-400"
          required
        >
          <option value="" disabled>
            Select target client brand
          </option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.brandName}
            </option>
          ))}
        </select>
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

      {/* Schedule At Date Picker (UTC stored, displayed in IST) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Target Scheduled Time (IST)</span>
          </label>
          <span className="text-[11px] text-slate-400">Optional for Drafts</span>
        </div>

        <div className="relative">
          <input
            type="datetime-local"
            value={scheduledAtInput}
            onChange={handleDateInput}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Times are converted to UTC for database storage and must be in the future.
        </p>
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

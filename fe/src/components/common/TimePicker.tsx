import React, { useState, useRef, useEffect } from 'react';
import { Clock, X, Sparkles } from 'lucide-react';

interface TimePickerProps {
  value?: string; // "HH:mm" in 24h format (e.g. "14:30")
  onChange: (timeString: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  placement?: 'top' | 'bottom' | 'auto';
  label?: string;
}

const padZero = (n: number) => n.toString().padStart(2, '0');

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select time (IST)...',
  disabled = false,
  className = '',
  placement = 'top',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom'>(
    placement === 'bottom' ? 'bottom' : 'top',
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse "HH:mm" (24h)
  const parse24h = (v?: string): { h12: number; m: number; ampm: 'AM' | 'PM' } => {
    if (!v) return { h12: 9, m: 0, ampm: 'AM' };
    const parts = v.split(':');
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    if (isNaN(h)) h = 9;
    const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { h12, m, ampm };
  };

  const initial = parse24h(value);
  const [hours12, setHours12] = useState<number>(initial.h12);
  const [minutes, setMinutes] = useState<number>(initial.m);
  const [amPm, setAmPm] = useState<'AM' | 'PM'>(initial.ampm);

  useEffect(() => {
    if (value) {
      const p = parse24h(value);
      setHours12(p.h12);
      setMinutes(p.m);
      setAmPm(p.ampm);
    }
  }, [value]);

  // Adjust placement based on prop or viewport space
  useEffect(() => {
    if (!isOpen) return;
    if (placement === 'top') {
      setActualPlacement('top');
      return;
    }
    if (placement === 'bottom') {
      setActualPlacement('bottom');
      return;
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceAbove > 340 || spaceAbove > spaceBelow) {
        setActualPlacement('top');
      } else {
        setActualPlacement('bottom');
      }
    }
  }, [isOpen, placement]);

  // Click outside and Escape to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const emitChange = (newH12: number, newM: number, newAmPm: 'AM' | 'PM') => {
    let h24 = newH12 % 12;
    if (newAmPm === 'PM') h24 += 12;
    const formatted = `${padZero(h24)}:${padZero(newM)}`;
    onChange(formatted);
  };

  const handleHourSelect = (h: number) => {
    setHours12(h);
    emitChange(h, minutes, amPm);
  };

  const handleMinuteSelect = (m: number) => {
    setMinutes(m);
    emitChange(hours12, m, amPm);
  };

  const handleAmPmToggle = (mode: 'AM' | 'PM') => {
    setAmPm(mode);
    emitChange(hours12, minutes, mode);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(undefined);
  };

  const handleQuickPreset = (preset: 'safeNow' | 'morning' | 'afternoon' | 'evening' | 'prime') => {
    if (preset === 'safeNow') {
      // Calculate current IST + 2h 15m
      const now = new Date();
      // add 2h 15m
      const target = new Date(now.getTime() + (2 * 60 + 15) * 60 * 1000);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(target);
      let h24 = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
      if (h24 === 24) h24 = 0;
      const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      const roundedM = Math.round(m / 5) * 5 % 60;

      const pAmPm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
      const pH12 = h24 % 12 === 0 ? 12 : h24 % 12;

      setHours12(pH12);
      setMinutes(roundedM);
      setAmPm(pAmPm);
      emitChange(pH12, roundedM, pAmPm);
    } else if (preset === 'morning') {
      setHours12(9);
      setMinutes(0);
      setAmPm('AM');
      emitChange(9, 0, 'AM');
    } else if (preset === 'afternoon') {
      setHours12(1);
      setMinutes(0);
      setAmPm('PM');
      emitChange(1, 0, 'PM');
    } else if (preset === 'evening') {
      setHours12(5);
      setMinutes(0);
      setAmPm('PM');
      emitChange(5, 0, 'PM');
    } else if (preset === 'prime') {
      setHours12(8);
      setMinutes(0);
      setAmPm('PM');
      emitChange(8, 0, 'PM');
    }
    setIsOpen(false);
  };

  const displayString = value ? `${padZero(hours12)}:${padZero(minutes)} ${amPm} IST` : '';

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Field */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between gap-2.5 transition select-none cursor-pointer px-3.5 py-2.5 rounded-xl border text-xs ${
          isOpen
            ? 'border-[#4f39f6] ring-2 ring-[#4f39f6]/20 bg-white shadow-xs'
            : 'border-slate-200 text-slate-800 bg-white hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Clock
            className={`w-4 h-4 shrink-0 ${
              value ? 'text-[#4f39f6]' : 'text-slate-400'
            }`}
          />
          {value ? (
            <span className="font-semibold text-slate-900 truncate">
              {label ? `${label}: ${displayString}` : displayString}
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Clear time"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Enterprise Time Card */}
      {isOpen && (
        <div
          className={`absolute left-0 ${
            actualPlacement === 'top'
              ? 'bottom-full mb-2 origin-bottom'
              : 'top-full mt-2 origin-top'
          } bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 w-[310px] z-50 animate-in fade-in-0 zoom-in-95 duration-100`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#4f39f6]" />
              <span>Select Time (IST)</span>
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#4f39f6]">
              {padZero(hours12)}:{padZero(minutes)} {amPm}
            </span>
          </div>

          {/* AM / PM Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-0.5 mb-3">
            <button
              type="button"
              onClick={() => handleAmPmToggle('AM')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                amPm === 'AM'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              AM (Morning)
            </button>
            <button
              type="button"
              onClick={() => handleAmPmToggle('PM')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                amPm === 'PM'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PM (Evening)
            </button>
          </div>

          {/* Hours (1-12) */}
          <div className="mb-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hour
            </span>
            <div className="grid grid-cols-6 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                const isSelected = hours12 === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`py-1 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#4f39f6] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {padZero(h)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minutes (5-min intervals) */}
          <div className="mb-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Minute
            </span>
            <div className="grid grid-cols-6 gap-1">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                const isSelected = minutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`py-1 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#4f39f6] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    :{padZero(m)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presets */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Slots
              </span>
              <button
                type="button"
                onClick={() => handleQuickPreset('safeNow')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4f39f6] hover:text-[#432ee0]"
              >
                <Sparkles className="w-3 h-3" />
                <span>+2h 15m (Safe)</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => handleQuickPreset('morning')}
                className="py-1 px-1 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                9:00 AM
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('afternoon')}
                className="py-1 px-1 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                1:00 PM
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('evening')}
                className="py-1 px-1 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                5:00 PM
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('prime')}
                className="py-1 px-1 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                8:00 PM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

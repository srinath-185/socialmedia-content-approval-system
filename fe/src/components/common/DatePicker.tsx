import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD string
  onChange: (dateString: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
  placement?: 'top' | 'bottom' | 'auto';
  label?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const padZero = (n: number) => n.toString().padStart(2, '0');

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select publication date...',
  disabled = false,
  minDate = new Date(),
  className = '',
  placement = 'top',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom'>(
    placement === 'bottom' ? 'bottom' : 'top',
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD or default to today
  const parseValueToDate = (v?: string): Date | null => {
    if (!v) return null;
    const parts = v.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
    const fallback = new Date(v);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const initialDate = parseValueToDate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<Date | null>(parseValueToDate(value));

  // Sync state if external value changes
  useEffect(() => {
    const parsed = parseValueToDate(value);
    setSelectedDate(parsed);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
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
      if (spaceAbove > 360 || spaceAbove > spaceBelow) {
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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDayDisabled = (day: number) => {
    const dateToCheck = new Date(viewYear, viewMonth, day, 23, 59, 59);
    const startOfToday = new Date(minDate);
    startOfToday.setHours(0, 0, 0, 0);
    return dateToCheck < startOfToday;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const handleDayClick = (day: number) => {
    if (isDayDisabled(day)) return;

    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
    const formatted = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'in2days' | 'nextWeek') => {
    const target = new Date();
    if (preset === 'today') {
      // today
    } else if (preset === 'tomorrow') {
      target.setDate(target.getDate() + 1);
    } else if (preset === 'in2days') {
      target.setDate(target.getDate() + 2);
    } else if (preset === 'nextWeek') {
      target.setDate(target.getDate() + 7);
    }

    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setSelectedDate(target);

    const formatted = `${target.getFullYear()}-${padZero(target.getMonth() + 1)}-${padZero(
      target.getDate(),
    )}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedDate(null);
    onChange(undefined);
  };

  const formatDisplay = (d: Date | null) => {
    if (!d) return '';
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  const displayString = formatDisplay(selectedDate);

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
          <CalendarIcon
            className={`w-4 h-4 shrink-0 ${
              selectedDate ? 'text-[#4f39f6]' : 'text-slate-400'
            }`}
          />
          {selectedDate ? (
            <span className="font-semibold text-slate-900 truncate">
              {label ? `${label}: ${displayString}` : displayString}
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedDate && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Enterprise Calendar Card */}
      {isOpen && (
        <div
          className={`absolute left-0 ${
            actualPlacement === 'top'
              ? 'bottom-full mb-2 origin-bottom'
              : 'top-full mt-2 origin-top'
          } bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 w-[310px] z-50 animate-in fade-in-0 zoom-in-95 duration-100`}
        >
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900 tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="text-[11px] font-semibold text-slate-400 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabledDay = isDayDisabled(day);
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleDayClick(day)}
                  className={`w-8 h-8 mx-auto rounded-xl text-xs flex items-center justify-center transition select-none ${
                    selected
                      ? 'bg-[#4f39f6] text-white font-bold shadow-xs'
                      : today
                        ? 'border border-[#4f39f6] text-[#4f39f6] font-semibold hover:bg-indigo-50'
                        : disabledDay
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Dates
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset('today')}
                className="py-1 px-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('tomorrow')}
                className="py-1 px-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('in2days')}
                className="py-1 px-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                +2 Days
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('nextWeek')}
                className="py-1 px-1.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 hover:text-[#4f39f6] transition text-center"
              >
                Next Wk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { formatToIST } from '../../utils/dateUtils';

interface DateTimePickerProps {
  value?: string; // ISO string or datetime-local string
  onChange: (isoString: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
  variant?: 'input' | 'pill';
  label?: string;
  placement?: 'top' | 'bottom' | 'auto';
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

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date and time (IST)...',
  disabled = false,
  minDate = new Date(),
  className = '',
  variant = 'input',
  label,
  placement = 'top',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom'>(
    placement === 'bottom' ? 'bottom' : 'top',
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date or default to now
  const parsedValue = value ? new Date(value) : null;
  const initialDate = parsedValue && !isNaN(parsedValue.getTime()) ? parsedValue : new Date();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    parsedValue && !isNaN(parsedValue.getTime()) ? parsedValue : null,
  );

  // Time state (12-hour format)
  const getInitialHours12 = () => {
    if (!parsedValue || isNaN(parsedValue.getTime())) return 9;
    const h = parsedValue.getHours();
    return h % 12 === 0 ? 12 : h % 12;
  };

  const getInitialMinutes = () => {
    if (!parsedValue || isNaN(parsedValue.getTime())) return 0;
    return parsedValue.getMinutes();
  };

  const getInitialAmPm = () => {
    if (!parsedValue || isNaN(parsedValue.getTime())) return 'AM';
    return parsedValue.getHours() >= 12 ? 'PM' : 'AM';
  };

  const [hours12, setHours12] = useState<number>(getInitialHours12);
  const [minutes, setMinutes] = useState<number>(getInitialMinutes);
  const [amPm, setAmPm] = useState<'AM' | 'PM'>(getInitialAmPm);

  // Sync state if external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        const h = d.getHours();
        setHours12(h % 12 === 0 ? 12 : h % 12);
        setMinutes(d.getMinutes());
        setAmPm(h >= 12 ? 'PM' : 'AM');
      }
    } else {
      setSelectedDate(null);
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
    // auto calculation
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

  // Click outside to close
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

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)

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

    let targetHours24 = hours12 % 12;
    if (amPm === 'PM') targetHours24 += 12;

    const newDate = new Date(viewYear, viewMonth, day, targetHours24, minutes, 0);
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (newHours: number, newMinutes: number, newAmPm: 'AM' | 'PM') => {
    setHours12(newHours);
    setMinutes(newMinutes);
    setAmPm(newAmPm);

    const baseDate = selectedDate || new Date();
    let targetHours24 = newHours % 12;
    if (newAmPm === 'PM') targetHours24 += 12;

    const newDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      targetHours24,
      newMinutes,
      0,
    );
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  const handleQuickPreset = (preset: 'now2h' | 'tomorrow9am' | 'tomorrow5pm') => {
    const target = new Date();
    if (preset === 'now2h') {
      // Add 2 hours and 15 mins (safely beyond 2-hour conflict window)
      target.setTime(target.getTime() + (2 * 60 + 15) * 60 * 1000);
    } else if (preset === 'tomorrow9am') {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow5pm') {
      target.setDate(target.getDate() + 1);
      target.setHours(17, 0, 0, 0);
    }

    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setSelectedDate(target);

    const h = target.getHours();
    setHours12(h % 12 === 0 ? 12 : h % 12);
    setMinutes(target.getMinutes());
    setAmPm(h >= 12 ? 'PM' : 'AM');

    onChange(target.toISOString());
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedDate(null);
    onChange(undefined);
  };

  const formattedDisplay = selectedDate ? formatToIST(selectedDate) : '';

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
        className={`w-full flex items-center justify-between gap-2.5 transition select-none cursor-pointer ${
          variant === 'pill'
            ? `px-4 py-1.5 rounded-full text-xs font-medium ${
                selectedDate || isOpen
                  ? 'border border-[#4f39f6] text-[#4f39f6] bg-indigo-50/20 shadow-xs'
                  : 'border border-slate-300 text-slate-700 bg-white hover:border-slate-400'
              }`
            : `px-3.5 py-2.5 rounded-xl border text-xs ${
                isOpen
                  ? 'border-[#4f39f6] ring-2 ring-[#4f39f6]/20 bg-white shadow-xs'
                  : 'border-slate-200 text-slate-800 bg-white hover:border-slate-300'
              }`
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
              {label ? `${label}: ${formattedDisplay}` : formattedDisplay}
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
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Floating Enterprise Calendar Card */}
      {isOpen && (
        <div
          className={`absolute left-0 ${
            actualPlacement === 'top'
              ? 'bottom-full mb-2 origin-bottom'
              : 'top-full mt-2 origin-top'
          } bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 w-[330px] z-50 animate-in fade-in-0 zoom-in-95 duration-100`}
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
                      ? 'border border-[#4f39f6] text-[#4f39f6] font-semibold hover:bg-indigo-50/50'
                      : disabledDay
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100 font-medium cursor-pointer'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Controls */}
          <div className="pt-3 border-t border-slate-100 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#4f39f6]" />
                Target Time (IST)
              </span>
              <span className="text-[10px] text-slate-400">Asia/Kolkata</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Hour selector */}
              <div className="flex-1">
                <select
                  value={hours12}
                  onChange={(e) =>
                    handleTimeChange(Number(e.target.value), minutes, amPm)
                  }
                  className="w-full py-1.5 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-hidden focus:border-[#4f39f6]"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-400 font-bold">:</span>

              {/* Minute selector */}
              <div className="flex-1">
                <select
                  value={minutes}
                  onChange={(e) =>
                    handleTimeChange(hours12, Number(e.target.value), amPm)
                  }
                  className="w-full py-1.5 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-hidden focus:border-[#4f39f6]"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM / PM Toggle */}
              <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleTimeChange(hours12, minutes, 'AM')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    amPm === 'AM'
                      ? 'bg-[#4f39f6] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange(hours12, minutes, 'PM')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    amPm === 'PM'
                      ? 'bg-[#4f39f6] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets for Campaign Scheduling */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => handleQuickPreset('now2h')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-[#4f39f6] text-slate-600 transition cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-[#4f39f6]" />
              +2h 15m (Safe)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('tomorrow9am')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-[#4f39f6] text-slate-600 transition cursor-pointer"
            >
              Tomorrow 9 AM
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('tomorrow5pm')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-[#4f39f6] text-slate-600 transition cursor-pointer"
            >
              Tomorrow 5 PM
            </button>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleClear()}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-[#4f39f6] hover:bg-[#432dd8] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

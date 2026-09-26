import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string; // Optional category name e.g. "Type", "Category", "Client", "Platform"
  variant?: 'pill' | 'form'; // 'pill' matches the filter pill in image.png; 'form' matches full-width form inputs
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
  showCheckmark?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  variant = 'pill',
  disabled = false,
  className = '',
  align = 'left',
  showCheckmark = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
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

  const selectedOption = options.find((opt) => opt.value === value);
  const isCustomSelection = value !== '' && value !== undefined && value !== 'ALL';

  const getDisplayLabel = () => {
    if (label) {
      if (selectedOption && isCustomSelection) {
        return `${label}: ${selectedOption.label}`;
      }
      return label;
    }
    if (selectedOption) {
      return selectedOption.label;
    }
    return placeholder;
  };

  const isActive = isOpen || isCustomSelection;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2.5 transition select-none ${
          variant === 'pill'
            ? `px-4 py-1.5 rounded-full text-sm font-medium ${
                isActive
                  ? 'border border-blue-600 text-blue-600 bg-blue-50/20 shadow-xs'
                  : 'border border-slate-300 text-slate-700 bg-white hover:border-slate-400'
              }`
            : `w-full px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                isOpen
                  ? 'border-2 border-blue-600 text-slate-900 bg-white shadow-xs'
                  : 'border border-slate-200 text-slate-800 bg-white hover:border-slate-300'
              }`
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <span className="truncate">{getDisplayLabel()}</span>
        {isOpen ? (
          <ChevronUp
            className={`w-3.5 h-3.5 shrink-0 transition ${
              isActive || variant === 'form' ? 'text-blue-600' : 'text-slate-500'
            }`}
          />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition ${
              isCustomSelection ? 'text-blue-600' : 'text-slate-500'
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu Modal / Card */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 px-1.5 min-w-[170px] max-h-72 overflow-y-auto z-50 animate-in fade-in-0 zoom-in-95 duration-100`}
        >
          {options.map((option) => {
            const isSelected = option.value === value || (option.value === '' && !value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-xl flex items-center gap-2.5 transition ${
                  isSelected
                    ? 'text-blue-600 font-medium bg-blue-50/40'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {showCheckmark && (
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isSelected ? (
                      <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    ) : null}
                  </span>
                )}
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <div className="flex flex-col truncate">
                  <span className="truncate">{option.label}</span>
                  {option.sublabel && (
                    <span className="text-[11px] text-slate-400 truncate">{option.sublabel}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

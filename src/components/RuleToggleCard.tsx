import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface RuleOption {
  value: number;
  label: string;
}

interface ModernRuleDropdownProps {
  value: number;
  options: RuleOption[];
  onChange: (value: number) => void;
  label?: string;
  variant?: 'bar' | 'compact';
}

export const ModernRuleDropdown: React.FC<ModernRuleDropdownProps> = ({
  value,
  options,
  onChange,
  label = 'হিসাবের নিয়ম:',
  variant = 'bar',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  const dropdownButton = (
    <div ref={containerRef} className={`relative ${variant === 'compact' ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 bg-white border-[1.5px] rounded-xl font-bold text-[13px] text-slate-800 transition-all cursor-pointer active:scale-[0.98] ${
          open
            ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-emerald-50/40'
            : 'border-slate-200 hover:border-emerald-400'
        } ${variant === 'compact' ? 'w-full h-[38px] px-2.5' : 'px-3 py-1.5'}`}
      >
        <span className="truncate text-emerald-900">{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-emerald-600 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 min-w-[175px] w-full bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50"
          style={{ boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.16)' }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                    : 'text-slate-700 font-semibold hover:bg-slate-50'
                }`}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (variant === 'compact') {
    return dropdownButton;
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 mb-4 flex items-center justify-between gap-3 no-print">
      <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">{label}</span>
      {dropdownButton}
    </div>
  );
};

interface GhaRuleSelectorProps {
  value: number;
  onChange: (rule: number) => void;
  variant?: 'bar' | 'compact';
}

export const GhaRuleSelector: React.FC<GhaRuleSelectorProps> = ({
  value,
  onChange,
  variant = 'bar',
}) => {
  return (
    <ModernRuleDropdown
      value={value}
      onChange={onChange}
      variant={variant}
      options={[
        { value: 21, label: '২১ ঘা = ১ কুড়ি' },
        { value: 20, label: '২০ ঘা = ১ কুড়ি' },
      ]}
    />
  );
};

export const ShuknoRuleSelector: React.FC<GhaRuleSelectorProps> = ({
  value,
  onChange,
  variant = 'compact',
}) => {
  return (
    <ModernRuleDropdown
      value={value}
      onChange={onChange}
      variant={variant}
      options={[
        { value: 82, label: '৮২ কেজি = ১ হাজার' },
        { value: 80, label: '৮০ কেজি = ১ হাজার' },
      ]}
    />
  );
};

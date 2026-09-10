'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 md:px-4 py-2.5 pr-8 md:pr-10 rounded-lg bg-[#1C1928] border border-white/10 text-white hover:border-[#D4AF6A]/60 transition outline-none flex items-center justify-between cursor-pointer text-sm md:text-base"
      >
        <span className="truncate">{selectedOption?.label || placeholder || 'Select...'}</span>
        <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-[#D4AF6A] transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-max mt-1 max-h-56 overflow-y-auto rounded-lg bg-[#1C1928] border border-white/10 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm transition-colors duration-150 cursor-pointer truncate ${
                option.value === value
                  ? 'bg-[#D4AF6A]/20 text-[#D4AF6A]'
                  : 'text-white hover:bg-[#242030] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
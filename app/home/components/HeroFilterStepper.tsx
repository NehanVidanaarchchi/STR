"use client";

import { useState, useRef, useEffect } from 'react';
import { Home, LayoutGrid, MapPin, Database, Sparkles, ChevronDown, Search, Check } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Property Type',
    icon: Home,
    options: ['Short-Term Rental', 'Mid-Term Rental', 'Resort & STR', 'Hotel & STR', 'Camping'],
    type: 'multiselect',
  },
  {
    id: 2,
    title: 'Portfolio Size',
    icon: LayoutGrid,
    options: ['1–10', '11–50', '51–200', '200+'],
    type: 'multiselect',
  },
  {
    id: 3,
    title: 'Location',
    icon: MapPin,
    options: ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'], 
    type: 'search-select',
  },
  {
    id: 4,
    title: 'PMS Status',
    icon: Database,
    options: ['Looking for PMS', 'Already have PMS'],
    type: 'multiselect',
  },
  {
    id: 5,
    title: 'Key Needs',
    icon: Sparkles,
    options: [
      'Analytics', 'Channel Manager', 'Consulting', 'Corporate / Mid-Term', 'Direct Booking',
      'Distribution', 'Franchise', 'Insurance', 'Market Intelligence', 'Marketing',
      'Messaging', 'Metasearch', 'Operations', 'PMS', 'Pricing', 'Procurement',
      'Smart Home', 'Staffing', 'Tax & Compliance', 'Trust'
    ],
    type: 'multiselect',
  },
];

export default function HeroFilterStepper() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<number, string[]>>({
    1: [], 2: [], 3: [], 4: [], 5: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveStep(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (stepId: number, option: string) => {
    setSelections(prev => {
      const current = prev[stepId];
      if (current.includes(option)) {
        return { ...prev, [stepId]: current.filter(item => item !== option) };
      } else {
        return { ...prev, [stepId]: [...current, option] };
      }
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 relative z-[999] text-gray-900" ref={containerRef}>
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white/10 p-2 rounded-3xl md:rounded-full backdrop-blur-md border border-white/20">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const hasSelection = selections[step.id].length > 0;
          
          return (
            <div key={step.id} className="relative w-full md:w-auto flex-1">
              <button
                onClick={() => {
                  setActiveStep(isActive ? null : step.id);
                  setSearchTerm(''); // reset search on toggle
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
                  isActive || hasSelection
                    ? 'bg-white shadow-lg text-blue-900'
                    : 'bg-white/80 hover:bg-white text-gray-700'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  isActive || hasSelection ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {step.id}
                </div>
                
                <div className="flex-1 text-left flex items-center justify-between min-w-0">
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-sm font-semibold truncate flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      {step.title}
                    </span>
                    {hasSelection && (
                      <span className="text-xs text-blue-600 truncate opacity-80 mt-0.5">
                        {selections[step.id].length} selected
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isActive && (
                <div className="absolute top-full left-0 w-full min-w-[280px] md:min-w-[320px] mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4">
                    <div className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                      Select {step.title}
                    </div>
                    
                    {step.type === 'search-select' && (
                      <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search location..."
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    )}
                    
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {step.options
                        .filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(option => {
                          const isSelected = selections[step.id].includes(option);
                          return (
                            <button
                              key={option}
                              onClick={() => toggleSelection(step.id, option)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                                isSelected 
                                  ? 'bg-blue-50 text-blue-700 font-medium' 
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              {option}
                              {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                            </button>
                          );
                      })}
                      {step.type === 'search-select' && step.options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <div className="text-sm text-gray-500 py-4 text-center">No locations found.</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
                    <button 
                      onClick={() => setSelections(prev => ({ ...prev, [step.id]: [] }))}
                      className="text-sm text-gray-500 hover:text-gray-900 font-medium px-2 py-1"
                      disabled={selections[step.id].length === 0}
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => setActiveStep(null)}
                      className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

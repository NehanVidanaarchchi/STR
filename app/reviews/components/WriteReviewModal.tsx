"use client";

import { useState, useEffect, useRef } from "react";
import { Star, Search, X, Building, Loader2 } from "lucide-react";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompany?: any;
}

export default function WriteReviewModal({ isOpen, onClose, initialCompany }: WriteReviewModalProps) {
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [overallRating, setOverallRating] = useState<number>(0);
  const [usabilityRating, setUsabilityRating] = useState<number>(0);
  
  // Dynamic Arrays for Pros/Cons
  const [pros, setPros] = useState([{ id: 1, value: "" }]);
  const [cons, setCons] = useState([{ id: 1, value: "" }]);
  
  const [comments, setComments] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/companies?all=true');
        const result = await response.json();
        if (result.success) {
          setCompanies(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
    
    // Reset state and set initial company if provided
    if (initialCompany) {
      setCompanySearch(initialCompany.name || "");
      setSelectedCompanyId(initialCompany.id || "");
    } else {
      setCompanySearch("");
      setSelectedCompanyId("");
    }
    setOverallRating(0);
    setUsabilityRating(0);
    setPros([{ id: 1, value: "" }]);
    setCons([{ id: 1, value: "" }]);
    setComments("");
  }, [isOpen, initialCompany]);

  
  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(companySearch.toLowerCase()) || ""
  );

  const isFormValid = selectedCompanyId !== "" && overallRating > 0 && usabilityRating > 0;

  const handleAddPro = () => setPros([...pros, { id: Date.now(), value: "" }]);
  const handleAddCon = () => setCons([...cons, { id: Date.now(), value: "" }]);

  const updatePro = (id: number, val: string) => {
    setPros(pros.map(p => p.id === id ? { ...p, value: val } : p));
  };
  
  const updateCon = (id: number, val: string) => {
    setCons(cons.map(c => c.id === id ? { ...c, value: val } : c));
  };

  const selectCompany = (company: any) => {
    setCompanySearch(company.name);
    setSelectedCompanyId(company.id);
    setShowDropdown(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div 
        className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
         <button 
           onClick={onClose}
           className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
         >
           <X className="w-5 h-5" />
         </button>

         <div className="p-10">
            <h2 className="text-[28px] font-extrabold text-[#111827] mb-1">Write a Review</h2>
            <p className="text-[15px] text-gray-600 mb-8 font-medium">Share your honest experience with the STR community</p>

            <div className="space-y-8">
              {/* Company Search Block */}
              <div ref={dropdownRef} className="relative">
                 <label className="block text-[14px] font-bold text-gray-900 mb-2">Company / Product Name <span className="text-gray-500">*</span></label>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder={isLoading ? "Loading companies..." : "Search for a company or product..."} 
                      value={companySearch}
                      onChange={(e) => {
                        setCompanySearch(e.target.value);
                        setSelectedCompanyId(""); // reset selection if they type
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      disabled={isLoading}
                      className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00D18F] focus:border-[#00D18F] outline-none transition-all shadow-sm text-[15px]" 
                    />
                    {isLoading && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                    )}
                 </div>
                 
                 {/* Autocomplete Dropdown */}
                 {showDropdown && companySearch && !selectedCompanyId && (
                   <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                     {filteredCompanies.length > 0 ? (
                       <ul className="py-2">
                         {filteredCompanies.map((company) => (
                           <li 
                             key={company.id}
                             onClick={() => selectCompany(company)}
                             className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                           >
                             <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden text-gray-400 border border-gray-200">
                               {company.logo_url ? (
                                 <img 
                                   src={company.logo_url.startsWith('http') ? company.logo_url : `https://odkasisncrxyskpnvqnh.supabase.co/storage/v1/object/public/company-logos/${company.logo_url}`} 
                                   alt={company.name} 
                                   className="w-full h-full object-cover" 
                                   onError={(e) => {
                                     (e.target as HTMLElement).style.display = 'none';
                                   }}
                                 />
                               ) : (
                                 <Building className="w-4 h-4" />
                               )}
                             </div>
                             <div>
                               <div className="font-semibold text-[14px] text-gray-900">{company.name}</div>
                               {company.primary_type && (
                                 <div className="text-[12px] text-gray-500">{company.primary_type}</div>
                               )}
                             </div>
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <div className="p-4 text-center text-[14px] text-gray-500">
                         No companies found matching "{companySearch}"
                       </div>
                     )}
                   </div>
                 )}
              </div>

              {/* Ratings Block */}
              <div className="space-y-5">
                 <div>
                    <label className="block text-[14px] font-bold text-gray-900 mb-2">Overall Rating <span className="text-gray-500">*</span></label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={`overall-${star}`}
                          type="button"
                          onClick={() => setOverallRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`w-8 h-8 ${star <= overallRating ? 'text-gray-300 fill-gray-300' : 'text-gray-200 fill-transparent'} transition-colors`} />
                        </button>
                      ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-[14px] font-bold text-gray-900 mb-2">Usability Rating <span className="text-gray-500">*</span></label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={`usability-${star}`}
                          type="button"
                          onClick={() => setUsabilityRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`w-8 h-8 ${star <= usabilityRating ? 'text-gray-300 fill-gray-300' : 'text-gray-200 fill-transparent'} transition-colors`} />
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Pros / Cons Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[14px] font-bold text-[#00B9CD] mb-3">What worked well <span className="font-normal text-gray-500">(optional)</span></label>
                    <div className="space-y-3">
                       {pros.map((pro) => (
                         <input 
                            key={pro.id}
                            type="text"
                            placeholder="Add a positive..."
                            value={pro.value}
                            onChange={(e) => updatePro(pro.id, e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B9CD] focus:border-[#00B9CD] outline-none shadow-sm text-[14px]"
                         />
                       ))}
                       <button onClick={handleAddPro} className="text-[#00B9CD] font-bold text-[13px] mt-2 flex items-center hover:underline">
                         + Add another
                       </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-[14px] font-bold text-[#FF8540] mb-3">Room for improvement <span className="font-normal text-gray-500">(optional)</span></label>
                    <div className="space-y-3">
                       {cons.map((con) => (
                         <input 
                            key={con.id}
                            type="text"
                            placeholder="Add an improvement..."
                            value={con.value}
                            onChange={(e) => updateCon(con.id, e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF8540] focus:border-[#FF8540] outline-none shadow-sm text-[14px]"
                         />
                       ))}
                       <button onClick={handleAddCon} className="text-[#FF8540] font-bold text-[13px] mt-2 flex items-center hover:underline">
                         + Add another
                       </button>
                    </div>
                 </div>
              </div>

              {/* More Comments */}
              <div>
                 <label className="block text-[14px] font-bold text-gray-900 mb-2">More Comments <span className="font-normal text-gray-500">(optional)</span></label>
                 <textarea 
                   rows={4}
                   placeholder="Anything else you'd like to share..."
                   value={comments}
                   onChange={(e) => setComments(e.target.value)}
                   className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none shadow-sm text-[15px] resize-y"
                 />
              </div>

              {/* Footer Continue */}
              <div className="pt-2">
                 <button 
                   disabled={!isFormValid || isSubmitting}
                   className={`w-full py-4 rounded-xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                     isFormValid && !isSubmitting
                       ? "bg-[#00D18F] hover:bg-[#00B97D] text-white shadow-md shadow-[#00D18F]/20" 
                       : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                   }`}
                   onClick={async () => {
                     if (!isFormValid) return;
                     setIsSubmitting(true);
                     try {
                       const res = await fetch("/api/reviews", {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({
                           company_id: selectedCompanyId,
                           overall_rating: overallRating,
                           usability_rating: usabilityRating,
                           pros: pros.map(p => p.value).filter(Boolean),
                           cons: cons.map(c => c.value).filter(Boolean),
                           comments
                         })
                       });
                       const data = await res.json();
                       if (data.success) {
                         onClose();
                       } else {
                         alert(data.error || "Failed to submit review");
                       }
                     } catch (err) {
                       console.error(err);
                       alert("An error occurred. Please try again.");
                     } finally {
                       setIsSubmitting(false);
                     }
                   }}
                 >
                   {isSubmitting ? (
                     <><Loader2 className="w-5 h-5 animate-spin"/> Submitting...</>
                   ) : (
                     "Continue"
                   )}
                 </button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

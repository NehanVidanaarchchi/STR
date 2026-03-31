"use client";

import { useState, useEffect } from "react";
import { Edit, Plus, Search, Loader2 } from "lucide-react";
import WriteReviewModal from "./components/WriteReviewModal";

export default function ReviewsHubPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [preselectedCompany, setPreselectedCompany] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [compRes, catRes] = await Promise.all([
          fetch("/api/companies?all=true"),
          fetch("/api/feature-categories")
        ]);
        
        const compData = await compRes.json();
        const catData = await catRes.json();

        if (compData.success) {
          setCompanies(compData.data || []);
        }
        if (catData.success) {
          setCategories(catData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBorderColor = (name: string) => {
    const colors = [
      "border-green-200", "border-orange-200", "border-red-200", 
      "border-blue-200", "border-pink-200", "border-yellow-200", 
      "border-teal-200", "border-gray-200"
    ];
    if (!name) return colors[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      company.primary_type === activeCategory ||
      (company.enabled_segments && company.enabled_segments.includes(activeCategory));
    
    return matchesSearch && matchesCategory;
  });
  
  const handleCompanyClick = (company: any) => {
    setPreselectedCompany(company);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-4xl px-4 py-16 flex flex-col items-center min-h-screen font-sans">
      
      {/* Top Tagline */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#E8FAFA] text-[#00B9CD] rounded-full text-[11px] font-bold uppercase tracking-wider mb-6 border border-[#BFF0F5]">
        <CommunityStarIcon className="w-3.5 h-3.5" />
        COMMUNITY REVIEWS
      </div>

      {/* Hero Header */}
      <h1 className="text-[44px] md:text-[52px] font-extrabold text-[#0F172A] tracking-tight mb-4 text-center leading-tight">
        Product Reviews & Ratings
      </h1>
      <p className="text-[17px] text-gray-500 mb-10 text-center max-w-[500px] leading-relaxed">
        Real experiences from STR operators. Select a company to explore its reviews.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
        <button 
          onClick={() => {
            setPreselectedCompany(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#00D18F] hover:bg-[#00B97D] text-white px-8 py-3.5 rounded-[12px] font-bold text-[15px] shadow-[0_4px_14px_0_rgba(0,209,143,0.39)] transition-all hover:-translate-y-0.5"
        >
          <Edit className="w-4 h-4" />
          Write a Review
        </button>
        <button 
          onClick={() => {
            document.getElementById("companies-grid")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#1F2937] px-8 py-3.5 rounded-[12px] font-bold text-[15px] border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 text-gray-400" />
          Pick a Company
        </button>
      </div>

      <div className="w-full border-t border-gray-100 mb-16"></div>

      {/* Search & Companies Segment */}
      <div className="w-full flex flex-col items-center">
        
        {/* Plus Anchor Circle */}
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#00B9CD]/40 flex items-center justify-center bg-[#F2FDFE] mb-6">
           <Plus className="w-8 h-8 text-[#00B9CD]" />
        </div>

        <h2 className="text-[26px] font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Pick a company to see its reviews
        </h2>
        <p className="text-[15px] text-gray-500 mb-10">
          Search below or pick from popular tools
        </p>

        {/* Search Bar */}
        <div className="w-full relative mb-12 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-hover:text-gray-600" />
          <input 
            type="text"
            placeholder="Search for any STR product or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-[#F8FAFC] border border-gray-200 rounded-[14px] outline-none focus:ring-2 focus:ring-[#00B9CD]/50 focus:border-[#00B9CD] transition-all text-[#0F172A] text-[16px] shadow-inner"
          />
        </div>

        {/* Filters */}
        <div className="w-full mb-10">
           <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
             FILTER BY CATEGORY
           </h4>
           {loading ? (
             <div className="flex items-center justify-between w-full p-4 border rounded-xl bg-gray-50">
               <span className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading categories...</span>
             </div>
           ) : (
             <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setActiveCategory("All")}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                    activeCategory === "All" 
                      ? "border-[#00B9CD] text-[#00B9CD] bg-[#F2FDFE]" 
                      : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                  }`}
                >
                  All
                </button>
                {categories.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                      activeCategory === cat.name 
                        ? "border-[#00B9CD] text-[#00B9CD] bg-[#F2FDFE]" 
                        : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
             </div>
           )}
        </div>

        {/* Popular Grid */}
        <div id="companies-grid" className="w-full scroll-mt-24">
           <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
             COMPANIES
           </h4>
           
           {loading ? (
             <div className="flex items-center justify-center p-12">
               <Loader2 className="w-8 h-8 text-[#00B9CD] animate-spin" />
             </div>
           ) : filteredCompanies.length === 0 ? (
             <div className="p-8 text-center text-gray-500 bg-gray-50 border border-gray-100 rounded-xl">
               No companies found matching your criteria.
             </div>
           ) : (
             <div className="flex flex-wrap gap-3">
                {filteredCompanies.map((company, i) => (
                  <button 
                    key={company.id || i}
                    onClick={() => handleCompanyClick(company)}
                    className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] hover:border-[#00B9CD] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className={`w-6 h-6 rounded overflow-hidden flex items-center justify-center border ${getBorderColor(company.name)} bg-gray-50 shrink-0`}>
                       {company.logo_url ? (
                         <img 
                           src={company.logo_url.startsWith('http') ? company.logo_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${company.logo_url}`} 
                           alt={company.name} 
                           className="w-full h-full object-cover" 
                           onError={(e) => {
                             (e.target as HTMLElement).style.display = 'none';
                             (e.target as HTMLElement).parentElement!.innerHTML = `<span class="text-[10px] font-bold text-gray-500">${company.name?.charAt(0) || '?'}</span>`;
                           }}
                         />
                       ) : (
                         <span className="text-[10px] font-bold text-gray-500">{company.name?.charAt(0) || '?'}</span>
                       )}
                    </div>
                    <span className="text-[14px] font-bold text-gray-800 group-hover:text-gray-900">{company.name}</span>
                  </button>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* Render the WriteReviewModal */}
      <WriteReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialCompany={preselectedCompany}
      />

    </div>
  );
}

// Minimal outlined star
function CommunityStarIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
}

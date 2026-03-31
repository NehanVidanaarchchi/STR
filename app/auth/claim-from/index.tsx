"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle,
  Search,
  TrendingUp,
  BarChart3,
  Bell,
  Award,
  Building2,
  Home,
  Users,
  LineChart,
  Target,
  Sparkles,
  Shield,
  Eye,
  Zap,
  MessageSquare,
  Star,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

interface CompanyOption {
  id: string;
  name: string;
  description?: string;
  generic_email?: string;

}

const ProviderClaimForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>({ type: 'idle' });

  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
const [debouncedCompanySearch, setDebouncedCompanySearch] = useState("");
const [companyPage, setCompanyPage] = useState(1);
const [companyTotalPages, setCompanyTotalPages] = useState(1);
const [isLoadingMore, setIsLoadingMore] = useState(false);

useEffect(() => {
  const t = setTimeout(() => setDebouncedCompanySearch(companySearch.trim()), 300);
  return () => clearTimeout(t);
}, [companySearch]);

useEffect(() => {
  if (!showCompanyDropdown) return;

  // reset when opening dropdown or search changes
  setCompanyPage(1);
  setAvailableCompanies([]);
  setCompanyTotalPages(1);
}, [debouncedCompanySearch, showCompanyDropdown]);

useEffect(() => {
  const fetchCompanies = async () => {
    if (!showCompanyDropdown) return;

    // first page uses main loading spinner, next pages use "loading more"
    if (companyPage === 1) setIsLoadingCompanies(true);
    else setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: String(companyPage),
        limit: "10",
      });

      if (debouncedCompanySearch) params.set("search", debouncedCompanySearch);

      const res = await fetch(`/api/companies?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      const json = await res.json();

      const next = json.data || [];
      const totalPages = json.totalPages || 1;

      setCompanyTotalPages(totalPages);

      setAvailableCompanies((prev) => {
        // if page 1, replace; else append (avoid duplicates)
        if (companyPage === 1) return next;

        const existingIds = new Set(prev.map((c) => c.id));
        const merged = [...prev, ...next.filter((c: any) => !existingIds.has(c.id))];
        return merged;
      });
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setIsLoadingCompanies(false);
      setIsLoadingMore(false);
    }
  };

  fetchCompanies();
}, [companyPage, debouncedCompanySearch, showCompanyDropdown]);



  // Filter companies based on search input
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return availableCompanies;
    const searchTerm = companySearch.toLowerCase();
    return availableCompanies.filter(company =>
      company.name.toLowerCase().includes(searchTerm) ||
      (company.description && company.description.toLowerCase().includes(searchTerm))
    );
  }, [companySearch, availableCompanies]);

  const handleCompanySelect = (company: CompanyOption) => {
    setSelectedCompany(company);
    setCompanySearch(company.name);
    setShowCompanyDropdown(false);

    // if (company.generic_email) {
    //   setEmail(company.generic_email);
    // } else {
    //   setEmail(''); // allow creating a new one
    // }
  };

  const handleCompanySearchChange = (value: string) => {
    setCompanySearch(value);
    setSelectedCompany(null);
    if (value.trim()) {
      setShowCompanyDropdown(true);
    } else {
      setShowCompanyDropdown(false);
    }
  };

  const handleCreateNewCompany = () => {
    // If user wants to create a new company
    setSelectedCompany({ id: 'new', name: companySearch });
    setShowCompanyDropdown(false);
  };

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const el = e.currentTarget;

  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

  if (
    nearBottom &&
    !isLoadingCompanies &&
    !isLoadingMore &&
    companyPage < companyTotalPages
  ) {
    setCompanyPage((p) => p + 1);
  }
};

  const validateForm = () => {
    if (!name.trim()) return 'Full name is required';
    if (!email.trim()) return 'Email is required';
    if (!companySearch.trim()) return 'Company name is required';
    if (!phone.trim()) return 'Phone number is required';
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!selectedCompany && companySearch.trim()) {
      setSelectedCompany({ id: "new", name: companySearch });
    }
    const isNewCompany =
      !selectedCompany || selectedCompany.id === "new";

    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormStatus({ type: 'error', message: validationError });
      return;
    }

    setFormStatus({ type: 'loading' });

    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name,
          work_email: email,
          company_name: companySearch,
          company_id: selectedCompany?.id !== 'new' ? selectedCompany?.id : null,
          is_new_company: isNewCompany,
          phone_number: phone,
          password: password,
          tell_us_about_company: description
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }
      Swal.fire({
        icon: "success",
        title: "Success",
        text: isNewCompany
          ? "Your request was submitted. The new company will be reviewed by the admin for approval."
          : "Your request was submitted! Please check your email for verification.",
        showConfirmButton: true,
      });
      setFormStatus({
        type: "success",
        message: isNewCompany
          ? "Submitted successfully. New company sent to admin for approval."
          : (data.message || "Submitted successfully! Please check your email for verification."),
      });

      // Reset form on success
      setName("");
      setEmail("");
      setCompanySearch("");
      setSelectedCompany(null);
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setDescription("");

      // setTimeout(() => {
      //   router.push('/auth/login');
      // }, 2000);

    } catch (error: any) {
      setFormStatus({
        type: 'error',
        message: error.message || 'An error occurred. Please try again.'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-left">
      {/* Form Status Messages */}
      {formStatus.type === 'success' && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/30">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-100">{formStatus.message}</span>
          </div>
        </div>
      )}

      {formStatus.type === 'error' && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-100">{formStatus.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-white/90 mb-2">Full Name *</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={formStatus.type === 'loading'}
            required
          />
        </div>
        <div className="relative">
          <label className="block text-white/90 mb-2">Company Name *</label>
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 pr-10"
              placeholder="Search or type your company name"
              value={companySearch}
              onChange={(e) => handleCompanySearchChange(e.target.value)}
              onFocus={() => setShowCompanyDropdown(true)}
              disabled={formStatus.type === 'loading'}
              required
            />
            <Search className="absolute right-3 top-3.5 w-5 h-5 text-white/50" />
          </div>

          {/* Company Dropdown */}
          {showCompanyDropdown && (
            <div
  className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
  onScroll={handleDropdownScroll}
>
              {isLoadingCompanies ? (
                <div className="p-4 flex items-center text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading companies...
                </div>
              ) : filteredCompanies.length > 0 ? (
                <div className="p-2">
                  <div className="text-xs text-gray-500 px-3 py-2">
                    Select from existing companies:
                  </div>

                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-md flex items-center justify-between group"
                      onClick={() => handleCompanySelect(company)}
                    >
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600">
                          {company.name}
                        </div>
                        {company.description && (
                          <div className="text-sm text-gray-500">
                            {company.description}
                          </div>
                        )}
                      </div>

                      {selectedCompany?.id === company.id && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </button>
                  ))}
{isLoadingMore && (
  <div className="p-3 flex items-center text-gray-500">
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    Loading more...
  </div>
)}

{!isLoadingMore && companyPage >= companyTotalPages && filteredCompanies.length > 0 && (
  <div className="p-3 text-xs text-gray-400 text-center">
    End of results
  </div>
)}

                  {companySearch.trim() &&
                    !filteredCompanies.some(
                      c => c.name.toLowerCase() === companySearch.toLowerCase()
                    ) && (
                      <div className="border-t pt-2 mt-2">
                        {/* <div className="text-xs text-gray-500 px-3 py-2">
                          Or create new company:
                        </div> */}
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-md flex items-center justify-between"
                          onClick={handleCreateNewCompany}
                        >
                          <div>
                            {/* <div className="font-medium text-gray-900 text-green-600">
                              Create "{companySearch}"
                            </div> */}
                            {/* <div className="text-sm text-gray-500">
                              Add as new company
                            </div> */}
                          </div>
                        </button>
                      </div>
                    )}
                </div>
              ) : (
                <></>
                // <div className="p-4 text-gray-500">
                //   No companies found
                // </div>
              )}
            </div>
          )}

          {/* Selected company badge */}
          {selectedCompany && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center">
                <Building2 className="w-4 h-4 text-blue-300 mr-2" />
                <span className="text-blue-100 text-sm">{selectedCompany.name}</span>
                {selectedCompany.id === 'new' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500/30 rounded-full text-xs text-green-200">
                    New
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCompany(null);
                  setCompanySearch('');
                }}
                className="text-white/70 hover:text-white text-sm"
              >
                Change
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-white/90 mb-2">Work Email *</label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            value={email}
            //disabled={!!selectedCompany?.generic_email}
            onChange={(e) => setEmail(e.target.value)}
          />

        </div>
        <div>
          <label className="block text-white/90 mb-2">Phone Number *</label>
          <input
            type="tel"
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={formStatus.type === 'loading'}
            required
          />
        </div>
        <div>
          <label className="block text-white/90 mb-2">Password *</label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={formStatus.type === 'loading'}
            required
            minLength={8}
          />
          <p className="text-white/60 text-sm mt-1">Minimum 8 characters</p>
        </div>
        <div>
          <label className="block text-white/90 mb-2">Confirm Password *</label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={formStatus.type === 'loading'}
            required
            minLength={8}
          />
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-red-300 text-sm mt-1">Passwords do not match</p>
          )}
        </div>
      </div>

      {/* <div className="mb-8">
        <label className="block text-white/90 mb-2">Tell us about your company (optional)</label>
        <textarea
          className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white min-h-[120px] disabled:opacity-50"
          placeholder="Brief description of your products/services..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={formStatus.type === 'loading'}
        />
      </div> */}

      <button
        type="submit"
        className="w-full py-4 rounded-lg bg-white text-blue-600 font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={formStatus.type === 'loading' || !name || !email || !companySearch || !phone || !password || !confirmPassword}
      >
        {formStatus.type === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Claim Your Free Profile'
        )}
      </button>

    </form>
  );
};

export default ProviderClaimForm;
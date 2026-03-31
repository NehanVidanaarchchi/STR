'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Globe, Linkedin, Mail, MapPin, Eye, Edit, Trash2, ExternalLink, X, Building } from 'lucide-react';
import AddCompanyLeadModal from '../components/company/AddCompanyLeadModal';
import { createClient } from '@/lib/supabase/client';
import Swal from 'sweetalert2';
import { Send } from "lucide-react";

// Define types
// Update your Company interface to include all fields
export interface Company {
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  email?: string;
  generic_email?: string;
  phone?: string;
  country?: string;
  contact_name?: string;
  founded_year?: number | string;
  primary_type?: string;
  invite_status?: string;
  primary_type_sug?: string;
  primary_type_confidence?: number;
  primary_type_reason?: string;
  product_summary_short?: string;
  product_summary_long?: string;
  favicon_url?: string;
  logo_url?: string;
  icon_url?: string;
  record_id_ajl_hs?: string;
  claim_status?: 'claimed' | 'unclaimed' | 'pending';
  provider_count?: number;
  provider_names?: string[];
  reference_count?: number;
  created_at: string;
  updated_at?: string;
}
const CompanyLeads = () => {
  const [leads, setLeads] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1); // reset to page 1 when search changes
    }, 400);

    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleDeleteLead = async (leadId: string) => {
    const confirm = await Swal.fire({
      title: "Delete company?",
      text: "Are you sure you want to delete this company?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E53E3E",
      cancelButtonColor: "#64748B",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch("/api/admin-companies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId }),
    });

    if (res.ok) {
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    }
  };

  const getPrimaryTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'PMS': 'bg-blue-100 text-blue-800',
      'Channel Manager': 'bg-purple-100 text-purple-800',
      'Pricing': 'bg-green-100 text-green-800',
      'Analytics': 'bg-indigo-100 text-indigo-800',
      'Messaging': 'bg-pink-100 text-pink-800',
      'Operations': 'bg-yellow-100 text-yellow-800',
      'Smart Home': 'bg-teal-100 text-teal-800',
      'Trust': 'bg-red-100 text-red-800',
      'Insurance': 'bg-orange-100 text-orange-800',
      'Distribution': 'bg-cyan-100 text-cyan-800',
      'Metasearch': 'bg-gray-100 text-gray-800',
      'Market Intelligence': 'bg-purple-100 text-purple-800',
      'Direct Booking': 'bg-green-100 text-green-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Procurement': 'bg-yellow-100 text-yellow-800',
      'Staffing': 'bg-indigo-100 text-indigo-800',
      'Tax & Compliance': 'bg-red-100 text-red-800',
      'Franchise': 'bg-orange-100 text-orange-800',
      'Corporate / Mid-Term': 'bg-teal-100 text-teal-800',
      'Consulting': 'bg-blue-100 text-blue-800'
    };

    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleEditClick = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleViewClick = (company: Company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  const handleSendInvite = async (company: Company) => {
    const recipient = company.generic_email || company.email;

    if (!recipient) {
      await Swal.fire({
        icon: "warning",
        title: "No email found",
        text: "This company does not have an email address.",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Send invite?",
      text: `Send STR Market Map join request to ${recipient}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2B6CB0",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch("/api/admin-companies/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: company.id }),
    });

    const json = await res.json();

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Invite sent",
        text: "The join request email was sent successfully.",
      });
    } else {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: json.error || "Failed to send invite email",
      });
    }
  };

const getPublicLogoUrl = (path?: string) => {
  if (!path) return null;

  // If it's already a full URL, return it
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Check if path already contains the full bucket structure
  if (path.includes('company-logos/') || path.includes('company-icons/') || path.includes('company-assets/')) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  }

  // Try company-icons bucket first (provider uploads)
  const { data: iconsData } = supabase.storage
    .from('company-icons')
    .getPublicUrl(path);
  
  if (iconsData.publicUrl) {
    return iconsData.publicUrl;
  }

  // Try company-assets bucket as fallback
  const { data: assetsData } = supabase.storage
    .from('company-assets')
    .getPublicUrl(path);

  return assetsData.publicUrl || null;
};

  const getClaimStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      claimed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Claimed' },
      unclaimed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unclaimed' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
    };

    const configData = config[status] || config.unclaimed;
    return (
      <span className={`px-2 py-1 ${configData.bg} ${configData.text} rounded-full text-[12px] font-medium`}>
        {configData.label}
      </span>
    );
  };

  const handleViewReferences = (company: Company) => {
    // You can open a modal or navigate to references page
    Swal.fire({
      title: "Customer References",
      html: `
      <div class="text-left">
        <p class="mb-2"><strong>Total References:</strong> ${company.reference_count || 0}</p>
        ${company.provider_names?.length ? `
          <p class="mb-2"><strong>Claimed by:</strong> ${company.provider_names.join(', ')}</p>
        ` : ''}
      </div>
    `,
      icon: "info",
      confirmButtonColor: "#2B6CB0",
    });
  };

  const handleSendClaimInvite = async (company: Company) => {
    const recipient = company.generic_email || company.email;

    if (!recipient) {
      await Swal.fire({
        icon: "warning",
        title: "No email found",
        text: "This company does not have an email address to send the claim invite.",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Send claim invite?",
      text: `Send claim invitation to ${recipient}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2B6CB0",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch("/api/admin-companies/send-claim-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: company.id, email: recipient }),
    });

    const json = await res.json();

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Invite sent",
        text: "The claim invitation was sent successfully.",
      });
    } else {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: json.error || "Failed to send invite email",
      });
    }
  };

  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const res = await fetch(`/api/admin-companies?${params.toString()}`);
        const json = await res.json();

        setLeads(Array.isArray(json.data) ? json.data : []);
        setTotalPages(json.totalPages || 1);
        setTotalCount(json.count || 0);
      } catch (err) {
        console.error("Failed to load companies", err);
        setLeads([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [page, limit, debouncedSearch]);


  const handleSaveCompany = (company: Company) => {
    setLeads(prev => {
      const exists = prev.find(c => c.id === company.id);
      if (exists) {
        return prev.map(c => (c.id === company.id ? company : c));
      }
      return [company, ...prev];
    });

    setIsModalOpen(false);
    setSelectedCompany(null);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] leading-[28px] font-medium text-[#0F172A]">Company</h2>
          <p className="text-[14px] leading-[20px] text-[#64748B] mt-1">
            Track and manage your company in the hospitality tech space
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name..."
                className="w-[280px] px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
              />
            </div>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
            <button
              className="px-4 py-2 bg-[#2B6CB0] text-white text-[14px] leading-[20px] font-medium rounded-lg hover:bg-[#2c5282] flex items-center gap-2"
              onClick={() => {
                setSelectedCompany(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Primary Type</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Invite Status</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Claim Status</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">References</th>
                <th className="px-6 py-3 text-right text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-[14px] leading-[20px] font-medium text-[#0F172A]">
                      {lead.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 ${getPrimaryTypeColor(lead.primary_type ?? "")} rounded-full text-[12px] font-medium`}>
                      {lead.primary_type ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 ${getPrimaryTypeColor(lead.invite_status ?? "")} rounded-full text-[12px] font-medium`}>
                      {lead.invite_status ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getClaimStatusBadge(lead.claim_status || 'unclaimed')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.provider_count && lead.provider_count > 0 ? (
                      <div className="text-[14px] leading-[20px] text-[#0F172A]">
                        <span className="font-medium">{lead.provider_count}</span>
                        <span className="text-[#64748B] ml-1">provider{lead.provider_count !== 1 ? 's' : ''}</span>
                        {lead.provider_names && (
                          <div className="text-[12px] text-[#64748B] truncate max-w-[150px]" title={lead.provider_names.join(', ')}>
                            {lead.provider_names.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[14px] leading-[20px] text-[#94A3B8]">No provider</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewReferences(lead)}
                      className="flex items-center text-[#2B6CB0] hover:text-[#2c5282] text-[14px]"
                    >
                      <span className="font-medium">{lead.reference_count || 0}</span>
                      <span className="ml-1">reference{(lead.reference_count || 0) !== 1 ? 's' : ''}</span>
                    </button>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    {lead.website_url ? (
                      <a
                        href={lead.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-[14px] leading-[20px] text-[#2B6CB0] hover:text-[#2c5282]"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        <span className="truncate max-w-[150px]">{lead.website_url.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-[14px] leading-[20px] text-[#94A3B8]">—</span>
                    )}
                  </td> */}
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    {lead.generic_email ? (
                      <a
                        href={`mailto:${lead.generic_email}`}
                        className="flex items-center text-[14px] leading-[20px] text-[#2B6CB0] hover:text-[#2c5282]"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate max-w-[150px]">{lead.generic_email}</span>
                      </a>
                    ) : (
                      <span className="text-[14px] leading-[20px] text-[#94A3B8]">—</span>
                    )}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* {lead.claim_status === 'unclaimed' && (
                        <button
                          className="text-emerald-600 hover:text-emerald-700 flex items-center px-3 py-1 hover:bg-emerald-50 rounded"
                          onClick={() => handleSendClaimInvite(lead)}
                          title="Send claim invitation"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Invite
                        </button>
                      )} */}
                      {/* <button
                        className="text-emerald-600 hover:text-emerald-700 flex items-center px-3 py-1 hover:bg-emerald-50 rounded"
                        onClick={() => handleSendInvite(lead)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Invite
                      </button>        */}
                      <button
                        className="text-[#2B6CB0] hover:text-[#2c5282] flex items-center px-3 py-1 hover:bg-blue-50 rounded"
                        onClick={() => handleViewClick(lead)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        className="text-[#2B6CB0] hover:text-[#2c5282] flex items-center px-3 py-1 hover:bg-blue-50 rounded"
                        onClick={() => handleEditClick(lead)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        className="text-[#E53E3E] hover:text-[#c53030] flex items-center px-3 py-1 hover:bg-red-50 rounded"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {leads.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-[#94A3B8] mb-4">
              <Globe className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-[#64748B] mb-2">No company leads yet</h3>
            <p className="text-[#94A3B8] mb-4">Get started by adding your first company lead</p>
            <button
              className="px-4 py-2 bg-[#2B6CB0] text-white text-[14px] leading-[20px] font-medium rounded-lg hover:bg-[#2c5282] flex items-center gap-2 mx-auto"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Lead
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B6CB0] mx-auto"></div>
            <p className="mt-4 text-[#64748B]">Loading companies...</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0]">
        <p className="text-sm text-[#64748B]">
          Showing page <span className="font-medium text-[#0F172A]">{page}</span> of{" "}
          <span className="font-medium text-[#0F172A]">{totalPages}</span> —{" "}
          <span className="font-medium text-[#0F172A]">{totalCount}</span> results
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-2 border border-[#CBD5E1] rounded-lg disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-2 border border-[#CBD5E1] rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add/Edit Company Lead Modal */}
      <AddCompanyLeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCompany(null);
        }}
        onSave={handleSaveCompany}
        company={selectedCompany}
        mode={selectedCompany ? 'edit' : 'add'}
      />


      {/* View Company Modal */}
      {isViewModalOpen && selectedCompany && (
  <div className="fixed inset-0 bg-[#00000069] bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-[#E2E8F0]">
        <div className="flex items-center">
          <div className="flex items-center gap-3">
            {selectedCompany.icon_url && (
              <img
                src={getPublicLogoUrl(selectedCompany.icon_url) || ''}
                alt={`${selectedCompany.name} icon`}
                className="w-8 h-8 rounded-lg object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-icon.png';
                }}
              />
            )}
            {selectedCompany.logo_url && (
              <img
                src={getPublicLogoUrl(selectedCompany.logo_url) || ''}
                alt={selectedCompany.name}
                className="w-12 h-12 rounded-lg object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-logo.png';
                }}
              />
            )}
            {!selectedCompany.icon_url && !selectedCompany.logo_url && (
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-[#0F172A]">{selectedCompany.name}</h3>
            <span className={`px-2 py-1 ${getPrimaryTypeColor(selectedCompany.primary_type ?? "")} rounded-full text-xs font-medium`}>
              {selectedCompany.primary_type}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsViewModalOpen(false)}
          className="text-[#64748B] hover:text-[#0F172A] p-1 hover:bg-[#F1F5F9] rounded-lg"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#64748B]">Website</label>
                  <p className="mt-1">
                    {selectedCompany.website_url ? (
                      <a href={selectedCompany.website_url} target="_blank" rel="noopener noreferrer" className="text-[#2B6CB0] hover:underline flex items-center">
                        {selectedCompany.website_url}
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    ) : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#64748B]">Email</label>
                  <p className="mt-1">
                    {selectedCompany.generic_email ? (
                      <a href={`mailto:${selectedCompany.generic_email}`} className="text-[#2B6CB0] hover:underline">
                        {selectedCompany.generic_email}
                      </a>
                    ) : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#64748B]">Country</label>
                  <p className="mt-1">{selectedCompany.country || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#64748B]">Phone</label>
                  <p className="mt-1">{selectedCompany.phone || '—'}</p>
                </div>
              </div>

              {selectedCompany.product_summary_short && (
                <div>
                  <label className="text-sm font-medium text-[#64748B]">Short Summary</label>
                  <p className="mt-1 text-[#0F172A]">{selectedCompany.product_summary_short}</p>
                </div>
              )}

              {selectedCompany.product_summary_long && (
                <div>
                  <label className="text-sm font-medium text-[#64748B]">Detailed Summary</label>
                  <p className="mt-1 text-[#0F172A] whitespace-pre-wrap">{selectedCompany.product_summary_long}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[#E2E8F0]">
                <p className="text-sm text-[#64748B]">
                  Created: {new Date(selectedCompany.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditClick(selectedCompany);
                }}
                className="px-4 py-2 bg-[#2B6CB0] text-white rounded-lg hover:bg-[#2c5282] font-medium"
              >
                Edit Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLeads;
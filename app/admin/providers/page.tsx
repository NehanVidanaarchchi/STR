"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Building, Calendar, User, Eye, Edit, Trash, Loader2, Trash2, Search, X } from 'lucide-react';
import EditProviderModal from "@/app/admin/providers/EditProviderModal";
import Swal from "sweetalert2";

type Product = {
  id: string;
  name: string;
  primary_type: string;
};
type Provider = {
  id: string;
  full_name: string;
  work_email: string;
  phone_number: string;
  company_name: string;
  claim_status: string;
  created_at: string;
  plan_id: string;
  tell_us_about_company: string;
  is_active: boolean;
  products?: Product[];
};

type ApiResponse = {
  success: boolean;
  data: Provider[];
};

const Providers = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
    const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/providers');

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error('API request failed');
      }

      if (!Array.isArray(result.data)) {
        throw new Error('Invalid data format received from API');
      }

      setProviders(result.data);
      setFilteredProviders(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProvider = async (providerId: string, providerName: string) => {
    const confirm = await Swal.fire({
      title: "Delete Provider?",
      text: `Are you sure you want to delete ${providerName}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E53E3E",
    });

    if (!confirm.isConfirmed) return;

    // Show loading
    Swal.fire({
      title: "Deleting...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch(`/api/providers/${providerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete provider');
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Provider has been deleted successfully.",
        confirmButtonColor: "#2B6CB0",
      });

      // Refresh the list
      fetchProviders();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err.message || "Something went wrong",
        confirmButtonColor: "#2B6CB0",
      });
    }
  };

  const approveProvider = async (providerId: string) => {
    const confirm = await Swal.fire({
      title: "Approve provider?",
      text: "This will approve the provider and create the company.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2B6CB0",
    });

    if (!confirm.isConfirmed) return;

    // Loading
    Swal.fire({
      title: "Approving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    console.log('Approving provider with ID:', providerId);

    try {
      const response = await fetch(`/api/providers/${providerId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to approve provider');
      }
      await Swal.fire({
        icon: "success",
        title: "Approved!",
        text: "Provider has been approved successfully.",
        confirmButtonColor: "#2B6CB0",
      });
      const result = await response.json();
      console.log('Approval result:', result);

      fetchProviders(); // Refresh the list
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Approval failed",
        text: err.message || "Something went wrong",
      });
    }
  };

  const handleProviderSaved = (updated: Provider) => {
    setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending_verification: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      reviewed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Reviewed' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`px-3 py-1 rounded-full text-[13px] leading-[18px] font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

    useEffect(() => {
    if (!providers.length) {
      setFilteredProviders([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredProviders(providers);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    const filtered = providers.filter(provider => {
      switch (searchFilter) {
        case 'name':
          return provider.full_name?.toLowerCase().includes(searchLower);
        
        case 'email':
          return provider.work_email?.toLowerCase().includes(searchLower);
        
        case 'company':
          return provider.company_name?.toLowerCase().includes(searchLower);
        
        case 'type':
          // Search in primary type from products
          return provider.products?.some(product => 
            product.primary_type?.toLowerCase().includes(searchLower)
          );
        
        case 'all':
        default:
          return (
            provider.full_name?.toLowerCase().includes(searchLower) ||
            provider.work_email?.toLowerCase().includes(searchLower) ||
            provider.company_name?.toLowerCase().includes(searchLower) ||
            provider.plan_id?.toLowerCase().includes(searchLower) ||
            provider.claim_status?.toLowerCase().includes(searchLower) ||
            provider.products?.some(product => 
              product.primary_type?.toLowerCase().includes(searchLower)
            )
          );
      }
    });

    setFilteredProviders(filtered);
  }, [searchTerm, searchFilter, providers]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  const handleRefresh = () => {
    fetchProviders();
  };
  const clearSearch = () => {
    setSearchTerm('');
  };
  const handleExport = async () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8,"
        + "Full Name,Email,Phone,Company,Status,Created At,Description,Active\n"
        + providers.map(p =>
          `"${p.full_name}","${p.work_email}","${p.phone_number}","${p.company_name}","${p.claim_status}","${formatDate(p.created_at)}","${p.tell_us_about_company}","${p.is_active ? 'Yes' : 'No'}"`
        ).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "providers_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#2B6CB0] animate-spin" />
          <p className="text-[#64748B]">Loading providers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading providers</p>
          <p className="text-[#64748B] text-sm">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#2B6CB0] text-white text-[14px] leading-[20px] font-medium rounded-lg hover:bg-[#2c5282]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] leading-[28px] font-medium text-[#0F172A]">Provider Submissions</h2>
          <p className="text-[14px] leading-[20px] text-[#64748B] mt-1">
                        {filteredProviders.length} of {providers.length} provider{providers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {/* <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] text-[14px] leading-[20px] font-medium rounded-lg hover:bg-[#F8FAFC]"
          >
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#2B6CB0] text-white text-[14px] leading-[20px] font-medium rounded-lg hover:bg-[#2c5282]"
          >
            Refresh
          </button>
        </div> */}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#94A3B8]" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search providers..."
              className="block w-full pl-10 pr-10 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent outline-none text-[14px]"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-[#94A3B8] hover:text-[#64748B]" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-4 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#0F172A] text-[14px] focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent outline-none"
          >
            <option value="all">All Fields</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="company">Company</option>
            <option value="type">Primary Type</option>
          </select>
        </div>

        {/* Search Results Summary */}
        {searchTerm && (
          <div className="mt-2 text-[13px] text-[#64748B]">
            Found {filteredProviders.length} result{filteredProviders.length !== 1 ? 's' : ''} for "{searchTerm}"
          </div>
        )}
      </div>
      {/* Providers Table */}
      <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
        {providers.length === 0 ? (
          <div className="text-center py-12 bg-white">
            <p className="text-[#64748B]">No provider submissions found.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Primary Type</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Payment Type</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Status</th>
                {/* <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Created At</th> */}
                <th className="px-6 py-3 text-right text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-[#F8FAFC]">
                  {/* Full Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-[14px] leading-[20px] font-medium text-[#0F172A]">{provider.full_name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-[14px] leading-[20px] text-[#0F172A]">
                      <span className="px-3 py-1.5 bg-[#F1F5F9] text-[#475569] rounded-md text-[13px] font-medium">
                        {provider.products && provider.products.length > 0
                          ? provider.products[0].primary_type
                          : '—'}
                      </span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-[14px] leading-[20px] text-[#0F172A]">
                      <a
                        href={`tel:${provider.plan_id}`}
                        className="text-[#2B6CB0] hover:text-[#2c5282] hover:underline"
                      >
                        {provider.plan_id}
                      </a>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-[14px] leading-[20px] text-[#0F172A]">
                      <Building className="w-4 h-4 mr-2 text-[#94A3B8]" />
                      <span className="truncate max-w-[150px]" title={provider.company_name}>
                        {provider.company_name}
                      </span>
                    </div>
                  </td>

                  {/* Status */}

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(provider.claim_status)}
                  </td>

                  {/* Created At */}
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-[14px] leading-[20px] text-[#0F172A]">
                      <Calendar className="w-4 h-4 mr-2 text-[#94A3B8]" />
                      {formatDate(provider.created_at)}
                    </div>
                  </td> */}

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-[14px] leading-[20px] font-medium">
                    <div className="flex items-center justify-end space-x-3">

                      {/* Approve Button (only if pending) */}
                      {provider.claim_status === "pending" && (
                        <button
                          onClick={() => approveProvider(provider.id)}
                          className="px-3 py-1 rounded-lg bg-[#2B6CB0] text-white text-[13px] hover:bg-[#2c5282]"
                          title="Approve Provider"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        className="text-[#2B6CB0] hover:text-[#2c5282] flex items-center px-3 py-1 hover:bg-blue-50 rounded"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        className="text-[#E53E3E] hover:text-[#c53030] flex items-center px-3 py-1 hover:bg-red-50 rounded"
                        onClick={() => deleteProvider(provider.id, provider.full_name)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                      {/* <button
      className="text-[#2B6CB0] hover:text-[#2c5282] flex items-center p-1 hover:bg-[#F1F5F9] rounded"
      title="View Details"
    >
      <Eye className="w-4 h-4" />
    </button>

    <button
      className="text-[#059669] hover:text-[#047857] flex items-center p-1 hover:bg-[#F1F5F9] rounded"
      title="Edit"
    >
      <Edit className="w-4 h-4" />
    </button>

     */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        )}

      </div>
      <EditProviderModal
        open={isEditOpen}
        provider={selectedProvider}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedProvider(null);
        }}
        onSaved={handleProviderSaved}
      />
    </div>
  );
};

export default Providers;
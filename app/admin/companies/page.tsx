'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Building, Globe, Mail, Calendar, Loader2 } from 'lucide-react';
import AddCompanyLeadModal from '../components/company/AddCompanyLeadModal';
import Swal from 'sweetalert2';

type Company = {
  id: string;
  name: string;
  website_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  country: string | null;
  primary_type: string | null;
  logo_url: string | null;
  contact_name: string | null;
  founded_year: number | null;
  created_at: string;
  product_summary_short: string | null;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-companies');
      const result = await response.json();
      
      if (result.success) {
        setCompanies(result.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedCompany(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEditClick = (company: Company) => {
    setSelectedCompany(company);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteClick = async (company: Company) => {
    const result = await Swal.fire({
      title: 'Delete Company?',
      text: `Are you sure you want to delete ${company.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin-companies?id=${company.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Company has been deleted.',
        timer: 2000,
        showConfirmButton: false
      });

      fetchCompanies();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete company'
      });
    }
  };

  const handleSave = async (savedCompany: any) => {
    setShowModal(false);
    await fetchCompanies();
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.primary_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Companies</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {companies.length} companies found
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#2B6CB0] text-white rounded-lg hover:bg-[#2c5282]"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
        />
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Founded</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#64748B] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[#64748B]">
                  No companies found
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
                          <Building className="w-4 h-4 text-[#64748B]" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[#0F172A]">{company.name}</div>
                        {company.website_url && (
                          <a
                            href={company.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#2B6CB0] hover:underline flex items-center gap-1 mt-1"
                          >
                            <Globe className="w-3 h-3" />
                            {company.website_url.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[#F1F5F9] text-[#0F172A] text-xs rounded-full">
                      {company.primary_type || 'Not set'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0F172A]">
                    {company.country || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {company.contact_name && (
                      <div className="text-sm text-[#0F172A]">{company.contact_name}</div>
                    )}
                    {company.email && (
                      <a
                        href={`mailto:${company.email}`}
                        className="text-xs text-[#2B6CB0] hover:underline flex items-center gap-1 mt-1"
                      >
                        <Mail className="w-3 h-3" />
                        {company.email}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0F172A]">
                    {company.founded_year || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(company)}
                        className="p-2 text-[#2B6CB0] hover:bg-[#F1F5F9] rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(company)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <AddCompanyLeadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        company={selectedCompany}
        mode={modalMode}
      />
    </div>
  );
}
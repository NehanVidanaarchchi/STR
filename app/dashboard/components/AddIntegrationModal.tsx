'use client';

import React, { useEffect, useState } from 'react';
import { X, Building } from 'lucide-react';
import Swal from 'sweetalert2';

interface Company {
  id: string;
  name: string;
  country?: string;
}

interface AddIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    companyId: string;
    type:
      | 'guest-experience'
      | 'operations'
      | 'distribution'
      | 'analytics'
      | 'finance';
  }) => void;
}

const AddIntegrationModal = ({
  isOpen,
  onClose,
  onSave,
}: AddIntegrationModalProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedType, setSelectedType] = useState<
    'guest-experience' | 'operations' | 'distribution' | 'analytics' | 'finance'
  >('operations');
  const [isLoading, setIsLoading] = useState(false);

  // AddIntegrationModal.tsx - Updated useEffect with loading state
  useEffect(() => {
    if (!isOpen) return;

    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/companies?all=true');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch companies');
        }
        
        setCompanies(result.data || []);
        
        // Show warning if no companies found
        if (!result.data || result.data.length === 0) {
          Swal.fire({
            title: 'No Companies Found',
            text: 'There are no companies available to add integrations for. Please create a company first.',
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6',
          });
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load companies. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      Swal.fire({
        title: 'Selection Required',
        text: 'Please select a company to add the integration.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    // Confirm before adding
    const result = await Swal.fire({
      title: 'Confirm Integration',
      text: 'Are you sure you want to add this integration?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Add it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        onSave({
          companyId: selectedCompany,
          type: selectedType,
        });

        await Swal.fire({
          title: 'Success!',
          text: 'Integration added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
          showConfirmButton: true,
        });

        handleClose();
      } catch (error) {
        console.error('Error adding integration:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to add integration. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  const handleClose = () => {
    setSelectedCompany('');
    setSelectedType('operations');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000069] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Add New Integration
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Connect with third-party services
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Company Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Select Company *
                </div>
              </label>

              {isLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading companies...</span>
                  </div>
                </div>
              ) : (
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  required
                >
                  <option value="">Choose a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                      {company.country ? ` (${company.country})` : ''}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Show company count */}
              {!isLoading && companies.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {companies.length} company{companies.length !== 1 ? 'ies' : ''} available
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedCompany || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                Add Integration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddIntegrationModal;
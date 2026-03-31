'use client';
import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown, Plus, MoreVertical, Trash2, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import AddIntegrationModal from '../components/AddIntegrationModal';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// Define types
interface Integration {
  id: string;
  partnerName: string;
  type: 'guest-experience' | 'operations' | 'distribution' | 'analytics' | 'finance';
  status: 'active' | 'pending' | 'inactive';
  dateAdded: string;
  companyId: string;
}

interface NewIntegrationData {
  companyId: string;
  type: 'guest-experience' | 'operations' | 'distribution' | 'analytics' | 'finance';
}

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [userRole, setUserRole] = useState<string>('');
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const router = useRouter();
  
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'guest-experience', label: 'Guest Experience' },
    { value: 'operations', label: 'Operations' },
    { value: 'distribution', label: 'Distribution' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'finance', label: 'Finance' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date Added' },
    { value: 'name', label: 'Partner Name' },
    { value: 'status', label: 'Status' }
  ];

  const handleAddIntegration = async (data: NewIntegrationData) => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add integration');
      }

      // Show success toast
      await Swal.fire({
        title: 'Success!',
        text: 'Integration added successfully',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      // Refresh integrations list
      const res = await fetch('/api/integrations');
      const json = await res.json();
      const formatted = json.data.map((i: any) => ({
        ...i,
        dateAdded: new Date(i.dateAdded).toLocaleDateString()
      }));
      setIntegrations(formatted);
      
    } catch (error) {
      console.error('Error adding integration:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to add integration. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleDeleteIntegration = async (id: string, partnerName: string) => {
    // Confirm before deletion
    const result = await Swal.fire({
      title: 'Remove Integration?',
      html: `Are you sure you want to remove <strong>${partnerName}</strong> integration?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        // Show loading state
        Swal.fire({
          title: 'Removing Integration...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await fetch('/api/integrations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete integration');
        }

        // Update local state
        setIntegrations(prev => prev.filter(i => i.id !== id));

        // Show success message
        await Swal.fire({
          title: 'Removed!',
          text: `${partnerName} integration has been removed.`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
        });
        
      } catch (error) {
        console.error('Error deleting integration:', error);
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to remove integration. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  const filteredIntegrations = integrations
    .filter(integration => {
      // Search filter
      const matchesSearch = integration.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
      // Type filter
      const matchesType = filterType === 'all' || integration.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sorting logic
      switch (sortBy) {
        case 'name':
          return a.partnerName.localeCompare(b.partnerName);
        case 'status':
          const statusOrder = { 'active': 1, 'pending': 2, 'inactive': 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'date':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
    }
  };

  const getTypeLabel = (type: Integration['type']) => {
    switch (type) {
      case 'guest-experience':
        return 'Guest Experience';
      case 'operations':
        return 'Operations';
      case 'distribution':
        return 'Distribution';
      case 'analytics':
        return 'Analytics';
      case 'finance':
        return 'Finance';
    }
  };

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          console.log(data, 'resssdddssdddd');

          setUserRole(data.role || 'Viewer');

          // Immediate redirect for Viewers with SweetAlert notification
          if (data.role === 'Viewer') {
            await Swal.fire({
              title: 'Access Denied',
              text: 'You do not have permission to view this page. Redirecting to dashboard...',
              icon: 'warning',
              confirmButtonText: 'OK',
              confirmButtonColor: '#f59e0b',
              allowOutsideClick: false,
            });
            router.replace('/dashboard');
            return;
          }
        } else {
          router.replace('/auth/login');
          return;
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        await Swal.fire({
          title: 'Authentication Error',
          text: 'Please login again to continue.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
        router.replace('/auth/login');
        return;
      } finally {
        setIsLoadingRole(false);
      }
    };

    getUserRole();
  }, [router]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations');
        if (!response.ok) {
          throw new Error('Failed to fetch integrations');
        }
        const res = await response.json();
        // format date on client
        const formatted = res.data.map((i: any) => ({
          ...i,
          dateAdded: new Date(i.dateAdded).toLocaleDateString()
        }));
        setIntegrations(formatted);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to load integrations. Please refresh the page.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444',
        });
      }
    };

    fetchIntegrations();
  }, []);

  // Show loading state while checking role
  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] leading-[28px] font-medium text-[#0F172A]">Integration Partners</h2>
          <p className="text-[14px] leading-[20px] text-[#64748B] mt-1">
            Connect and manage third-party services with your property management system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 bg-[#2B6CB0] text-white text-[14px] leading-[20px] font-medium rounded-lg hover:bg-[#2c5282] flex items-center gap-2 transition-colors"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search integration partners..."
                className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] leading-[20px] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748B]" />
              <select
                className="appearance-none bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 pr-10 text-[14px] leading-[20px] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent cursor-pointer transition"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>

          {/* Sort by */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#64748B]" />
              <select
                className="appearance-none bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 pr-10 text-[14px] leading-[20px] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent cursor-pointer transition"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">
                  Partner Name
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-3 text-right text-[12px] leading-[16px] font-medium text-[#64748B] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {filteredIntegrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-0">
                        <div className="text-[14px] leading-[20px] font-medium text-[#0F172A]">
                          {integration.partnerName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-[#EFF6FF] text-[#2B6CB0] rounded-full text-[12px] font-medium">
                      {getTypeLabel(integration.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(integration.status)}
                      <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-[14px] leading-[20px] text-[#0F172A]">
                      <Calendar className="w-4 h-4 mr-2 text-[#94A3B8]" />
                      {integration.dateAdded}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      <button
                        className="text-[#E53E3E] hover:text-[#c53030] flex items-center px-3 py-1 hover:bg-red-50 rounded transition-colors"
                        onClick={() => handleDeleteIntegration(integration.id, integration.partnerName)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="text-sm">Remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-[#64748B] text-[14px] leading-[20px]">
              No integrations found matching your criteria
            </div>
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      <AddIntegrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddIntegration}
      />
    </div>
  );
};

export default IntegrationsPage;
'use client';

import { useState, useEffect } from 'react';
import { Mail, User, MapPin, FileText, Download, Search, Filter, Trash2, Building, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

type FieldRequest = {
  id: string;
  field_name: string;
  field_description: string;
  contact_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  feature_category_id: string | null;
  feature_category?: {
    id: string;
    name: string;
    kind: string;
  } | null;
  provider?: {
    id: string;
    full_name: string;
    work_email: string;
    company_name: string;
  } | null;
};

export default function FieldRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [fieldRequests, setFieldRequests] = useState<FieldRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Fetch field requests
  useEffect(() => {
    fetchFieldRequests();
    fetchCategories();
  }, []);

const fetchFieldRequests = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/admin-field-requests');
    const data = await response.json();
    console.log(data, 'datadatadatadata');
    
    // Check if response is OK and data exists
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    // Make sure data.requests exists and is an array
    if (data && Array.isArray(data.requests)) {
      setFieldRequests(data.requests);
      setError(null); // Clear any previous errors
    } else {
      console.error('Unexpected data format:', data);
      setFieldRequests([]);
      throw new Error('Invalid data format received from server');
    }
  } catch (err) {
    console.error('Error fetching field requests:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch field requests');
  } finally {
    setLoading(false);
  }
};

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/feature-categories?kind=catalogue');
      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const deleteRequest = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Field Request?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E53E3E',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/field-requests?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete field request');
      }

      setFieldRequests(requests => requests.filter(request => request.id !== id));

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Field request has been deleted.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error deleting field request:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: err instanceof Error ? err.message : 'Failed to delete field request',
      });
    }
  };

  const updateRequestStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin-field-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setFieldRequests(requests =>
        requests.map(req =>
          req.id === id ? { ...req, status: newStatus } : req
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Field request ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error updating status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update failed',
        text: err instanceof Error ? err.message : 'Failed to update status',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejected' },
    };

    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  const filteredRequests = fieldRequests.filter(request => {
    const matchesSearch = 
      request.field_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.field_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.provider?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.provider?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || request.feature_category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Provider Name,Provider Company,Provider Email,Field Name,Field Description,Category,Status,Submitted Date\n"
      + filteredRequests.map(r =>
        `"${r.provider?.full_name || 'N/A'}","${r.provider?.company_name || 'N/A'}","${r.contact_email}","${r.field_name}","${r.field_description}","${r.feature_category?.name || 'N/A'}","${r.status}","${formatDate(r.created_at)}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "field_requests_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unique statuses and categories for filters
  const statuses = ['all', 'pending', 'approved', 'rejected'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading field requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFieldRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Field Requests</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage field customization requests from providers
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by provider, field name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Requests</p>
            <p className="text-2xl font-bold text-blue-700">{fieldRequests.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">
              {fieldRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-700">
              {fieldRequests.filter(r => r.status === 'approved').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-700">
              {fieldRequests.filter(r => r.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No field requests found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {request.provider?.full_name || 'Unknown Provider'}
                          </span>
                        </div>
                        {request.provider?.company_name && (
                          <div className="flex items-center gap-2 mt-1">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {request.provider.company_name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a 
                            href={`mailto:${request.contact_email}`}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {request.contact_email}
                          </a>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900">{request.field_name}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={request.field_description}>
                          {request.field_description}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {request.feature_category ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {request.feature_category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateRequestStatus(request.id, 'approved')}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve request"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateRequestStatus(request.id, 'rejected')}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject request"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteRequest(request.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>
            Showing {filteredRequests.length} of {fieldRequests.length} requests
          </div>
        </div>
      </div>
    </div>
  );
}
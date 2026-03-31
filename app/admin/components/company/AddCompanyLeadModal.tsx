'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Globe, Linkedin, Mail, Phone, MapPin, FileText, Type, Upload, Image, User, UserPlus, Hash, Calendar, Plus, Check, Building, Info } from 'lucide-react';
import countries from "world-countries";
import Swal from "sweetalert2";
import AddReferenceModal from './AddReferenceModal';
import { createClient } from '@/lib/supabase/client'

// Define types
interface CompanyLeadData {
  companyName: string;
  website: string;
  linkedin: string;
  email: string;
  country: string;
  primaryType: string;
  productSummaryShort: string;
  productSummaryLong: string;
  generic_email: string;
  icon: string | File;
  contactName?: string;
  founded_year?: string;
  recordId?: string;
  primaryTypeConfidence?: number;
  primaryTypeReason?: string;
  primaryTypeSug?: string;
}

interface Reference {
  id: string;
  customer_name: string;
  company_name: string;
  email: string;
  website: string;
  segment: string;
  status: 'pending' | 'confirmed';
  confirmation_token?: string;
  created_at: string;
  confirmed_at?: string;
}

interface AddCompanyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: any) => void;
  company?: any;
  mode?: 'add' | 'edit';
}

interface FormErrors {
  companyName?: string;
  website?: string;
  email?: string;
  phone?: string;
  primaryType?: string;
  generic_email?: string;
  icon?: string;
}
const supabase = createClient();

const COUNTRIES = countries
  .map(c => ({
    code: c.cca2,
    name: c.name.common,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const PRIMARY_TYPES = [
  'PMS',
  'Channel Manager',
  'Pricing',
  'Analytics',
  'Messaging',
  'Operations',
  'Smart Home',
  'Trust',
  'Insurance',
  'Distribution',
  'Metasearch',
  'Market Intelligence',
  'Direct Booking',
  'Marketing',
  'Procurement',
  'Staffing',
  'Tax & Compliance',
  'Franchise',
  'Corporate / Mid-Term',
  'Consulting'
];

const SEGMENTS = [
  "1–10 Units",
  "11–50 Units",
  "51–200 Units",
  "200+ Units"
];

const AddCompanyLeadModal = ({ isOpen, onClose, onSave, company, mode = 'add' }: AddCompanyLeadModalProps) => {
  const [formData, setFormData] = useState<CompanyLeadData>({
    companyName: '',
    website: '',
    linkedin: '',
    email: '',
    country: '',
    generic_email: '',
    primaryType: '',
    productSummaryShort: '',
    productSummaryLong: '',
    icon: '',
    contactName: '',
    founded_year: '',
    recordId: '',
    primaryTypeConfidence: 0,
    primaryTypeReason: '',
    primaryTypeSug: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // References state
  const [references, setReferences] = useState<Reference[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [showAddReferenceModal, setShowAddReferenceModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState('');

  const getPublicImageUrl = (path?: string) =>
    path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`
      : "/placeholder-logo.png";
  const getPublicIconImageUrl = (path?: string) =>
    path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`
      : "/placeholder-logo.png";

      const getCompanyImageUrl = (path?: string | null) => {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // For icon URLs - they should be in company-icons bucket
  if (path.includes('/company-icons/') || path.startsWith('companies/')) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`;
  }

  // For logo URLs - they should be in company-logos bucket
  if (path.includes('/company-logos/')) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`;
  }

  // Default to company-icons bucket
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`;
};

  // Load references when editing a company
  useEffect(() => {
    if (company && mode === 'edit' && company.id) {
      loadReferences(company.id);
    }
  }, [company, mode]);

  const loadReferences = async (companyId: string) => {
    setLoadingReferences(true);
    try {
      const response = await fetch(`/api/admin-companies/references?companyId=${companyId}`);
      const data = await response.json();
      
      if (response.ok) {
        setReferences(data.references || []);
      } else {
        console.error('Failed to load references:', data.error);
      }
    } catch (error) {
      console.error('Error loading references:', error);
    } finally {
      setLoadingReferences(false);
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (company && mode === 'edit') {
      setFormData({
        companyName: company.name || '',
        website: company.website_url || '',
        linkedin: company.linkedin_url || '',
        email: company.email || '',
        generic_email: company.generic_email || '',
        country: company.country || '',
        primaryType: company.primary_type || '',
        productSummaryShort: company.product_summary_short || '',
        productSummaryLong: company.product_summary_long || '',
        icon: company.logo_url || '',
        contactName: company.contact_name || '',
        founded_year: company.founded_year ? String(company.founded_year) : '',
        recordId: company.record_id_ajl_hs || '',
        primaryTypeConfidence: company.primary_type_confidence || 0,
        primaryTypeReason: company.primary_type_reason || '',
        primaryTypeSug: company.primary_type_sug || '',
      });

          const imagePath = company.logo_url;
    if (imagePath) {
      console.log('Company image path from DB:', imagePath);
      const imageUrl = getCompanyImageUrl(imagePath);
      console.log('Generated preview URL:', imageUrl);
      setPreviewImage(imageUrl);
    }
    } else {
      // Reset form when adding new
      setFormData({
        companyName: '',
        website: '',
        linkedin: '',
        email: '',
        generic_email: '',
        country: '',
        primaryType: '',
        productSummaryShort: '',
        productSummaryLong: '',
        icon: '',
        contactName: '',
        founded_year: '',
        recordId: '',
        primaryTypeConfidence: 0,
        primaryTypeReason: '',
        primaryTypeSug: '',
      });
      setPreviewImage(null);
      setReferences([]);
    }
  }, [company, mode, isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.website.trim()) {
      const websiteRegex =
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

      if (!websiteRegex.test(formData.website.trim())) {
        newErrors.website = "Please enter a valid website URL";
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.primaryType) {
      newErrors.primaryType = 'Primary type is required';
    }

    // Validate file if it's uploaded (and is actually a File object)
    if (formData.icon instanceof File) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(formData.icon.type)) {
        newErrors.icon = 'Only JPG, PNG, GIF, and WebP images are allowed';
      } else if (formData.icon.size > maxSize) {
        newErrors.icon = 'Image size must be less than 5MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('=== Form submit triggered ===');

    if (!validateForm()) return;

    const isEdit = mode === "edit";

    const confirm = await Swal.fire({
      title: isEdit ? "Update company?" : "Add company?",
      text: isEdit
        ? "This will update the existing company details."
        : "This will create a new company record.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isEdit ? "Update" : "Add",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2B6CB0",
    });

    if (!confirm.isConfirmed) return;

    try {
      const payload = new FormData();

      // Send file only if it's a File object (not a string URL)
      if (formData.icon instanceof File) {
        payload.append('file', formData.icon);
        console.log('Adding file to FormData:', formData.icon.name);
      }

      // For edit mode, include the existing logo URL and company ID
      if (mode === 'edit' && company) {
        payload.append('id', company.id);
        console.log('Adding company ID:', company.id);

        // If icon is a string (URL), add it as existingLogoUrl
  // If icon is a string (path/URL), add it as existingIconUrl
  if (typeof formData.icon === 'string' && formData.icon) {
    // Extract just the path if it's a full URL
    let iconPath = formData.icon;
    
    // If it's a full Supabase URL, extract the path
    if (iconPath.includes('/storage/v1/object/public/')) {
      // Match the part after the bucket name
      const matches = iconPath.match(/\/storage\/v1\/object\/public\/(?:company-icons|company-logos)\/(.+)/);
      if (matches && matches[1]) {
        iconPath = matches[1];
      }
    }
    
    payload.append('existingIconUrl', iconPath);
    console.log('Adding existingIconUrl path:', iconPath);
  }
      }

      // Prepare the data object
      const formDataObj = {
        companyName: formData.companyName,
        website: formData.website,
        linkedin: formData.linkedin,
        email: formData.email,
        generic_email: formData.generic_email,
        country: formData.country,
        primaryType: formData.primaryType,
        productSummaryShort: formData.productSummaryShort,
        productSummaryLong: formData.productSummaryLong,
        contactName: formData.contactName,
        founded_year: formData.founded_year,
        recordId: formData.recordId,
        primaryTypeConfidence: formData.primaryTypeConfidence,
        primaryTypeReason: formData.primaryTypeReason,
        primaryTypeSug: formData.primaryTypeSug,
      };

      console.log('Form data to send:', formDataObj);

      // Send the rest of the form as JSON
      payload.append('data', JSON.stringify(formDataObj));

      const endpoint = '/api/admin-companies';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      console.log(`Making ${method} request to ${endpoint}`);

      // Log FormData contents
      console.log('FormData contents:');
      for (const pair of payload.entries()) {
        console.log(`${pair[0]}:`, pair[0] === 'file' ? 'File object' : pair[1]);
      }

      // IMPORTANT: Do NOT set any headers
      const res = await fetch(endpoint, {
        method,
        body: payload,
      });

      console.log('Response status:', res.status, res.statusText);

      const result = await res.json();
      console.log('API Response:', result);

      if (!res.ok) {
        throw new Error(result.error || "Unknown error");
      }

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Updated!" : "Added!",
        text: isEdit
          ? "Company updated successfully."
          : "Company added successfully.",
        confirmButtonColor: "#2B6CB0",
      });
      console.log('Success! Calling onSave...');
      onSave(result.data);
      console.log('Closing modal...');
      handleClose();

      return false; // Prevent default form behavior
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error: ' + (err as Error).message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === 'primaryTypeConfidence') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        icon: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous icon error
      if (errors.icon) {
        setErrors(prev => ({
          ...prev,
          icon: ''
        }));
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      icon: ''
    }));
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setFormData({
      companyName: '',
      website: '',
      linkedin: '',
      email: '',
      generic_email: '',
      country: '',
      primaryType: '',
      productSummaryShort: '',
      productSummaryLong: '',
      icon: '',
      contactName: '',
      founded_year: '',
      recordId: '',
      primaryTypeConfidence: 0,
      primaryTypeReason: '',
      primaryTypeSug: '',
    });
    setErrors({});
    setPreviewImage(null);
    setReferences([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const openAddReferenceModal = (segment: string) => {
    setSelectedSegment(segment);
    setShowAddReferenceModal(true);
  };

  const handleAddReference = async (referenceData: {
    customerName: string;
    companyName: string;
    email: string;
    website: string;
  }) => {
    if (!company?.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Company must be saved first before adding references",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin-companies/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          segment: selectedSegment,
          customerName: referenceData.customerName,
          companyName: referenceData.companyName,
          email: referenceData.email,
          website: referenceData.website,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add reference');
      }

      // Add the new reference to the list
      setReferences(prev => [...prev, data.reference]);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Reference added successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error adding reference:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to add reference",
      });
    }
  };

  const handleDeleteReference = async (referenceId: string) => {
    const confirm = await Swal.fire({
      title: "Delete reference?",
      text: "Are you sure you want to delete this reference?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E53E3E",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin-companies/references?id=${referenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete reference');
      }

      setReferences(prev => prev.filter(ref => ref.id !== referenceId));

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Reference deleted successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error deleting reference:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to delete reference",
      });
    }
  };

  const getConfirmedCount = (segment: string) => {
    return references.filter(ref => ref.segment === segment && ref.status === 'confirmed').length;
  };

  const getReferencesBySegment = (segment: string) => {
    return references.filter(ref => ref.segment === segment);
  };

  return (
    <div className="fixed inset-0 bg-[#00000069] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-[#E2E8F0] z-10">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">
              {mode === 'edit' ? 'Edit Company Lead' : 'Add New Company Lead'}
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              {mode === 'edit' ? 'Update company information' : 'Add a new company to your leads database'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1 hover:bg-[#F1F5F9] rounded-lg"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${errors.companyName ? 'border-red-300' : 'border-[#CBD5E1]'
                    }`}
                  placeholder="Enter company name"
                />
                {errors.companyName && (
                  <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${errors.website ? 'border-red-300' : 'border-[#CBD5E1]'
                    }`}
                  placeholder="https://example.com"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  <Linkedin className="inline w-4 h-4 mr-1" />
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  <User className="inline w-4 h-4 mr-1" />
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Generic Email
                </label>
                <input
                  type="email"
                  name="generic_email"
                  value={formData.generic_email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${
                    errors.generic_email ? 'border-red-300' : 'border-[#CBD5E1]'
                  }`}
                  placeholder="hello@company.com"
                />
                {errors.generic_email && (
                  <p className="text-red-500 text-xs mt-1">{errors.generic_email}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Type */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  <Type className="inline w-4 h-4 mr-1" />
                  Primary Type *
                </label>
                <select
                  name="primaryType"
                  value={formData.primaryType}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${errors.primaryType ? 'border-red-300' : 'border-[#CBD5E1]'
                    }`}
                >
                  <option value="">Select primary type</option>
                  {PRIMARY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.primaryType && (
                  <p className="text-red-500 text-xs mt-1">{errors.primaryType}</p>
                )}
              </div>

              {/* Founder Year */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Founder Year
                </label>
                <input
                  type="text"
                  name="founded_year"
                  value={formData.founded_year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
                  placeholder="Founder year"
                />
              </div>
            </div>
          </div>

          {/* Company Icon Upload */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-[#0F172A] mb-4">Company Logo / Icon</h3>
            <p className="text-sm text-[#64748B] mb-4">
              {mode === 'edit' ? 'Upload a new logo to replace the existing one' : 'Upload company logo or icon'}
            </p>

            <input
              ref={fileInputRef}
              id="company-icon-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {previewImage ? (
              <div className="border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Image className="w-5 h-5 text-[#64748B] mr-2" />
                    <span className="text-sm font-medium text-[#0F172A]">
                      {formData.icon instanceof File ? formData.icon.name : 'Current Icon'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <label
                htmlFor="company-icon-upload"
                className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-8 text-center hover:border-[#2B6CB0] transition-colors cursor-pointer block"
              >
                <Upload className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
                <p className="text-sm text-[#64748B] mb-2">
                  {mode === 'edit' ? 'Click to upload new logo' : 'Click to upload company logo or icon'}
                </p>
                <p className="text-xs text-[#94A3B8]">PNG, JPG, GIF, WebP up to 5MB</p>
              </label>
            )}

            {errors.icon && (
              <p className="text-red-500 text-xs mt-2">{errors.icon}</p>
            )}
          </div>

          {/* Product Summary Short */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              Product Summary (Short)
            </label>
            <input
              type="text"
              name="productSummaryShort"
              value={formData.productSummaryShort}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
              placeholder="Brief product description"
              maxLength={100}
            />
            <p className="text-xs text-[#64748B] mt-1">
              {formData.productSummaryShort.length}/100 characters
            </p>
          </div>

          {/* Product Summary Long */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              <FileText className="inline w-4 h-4 mr-1" />
              Product Summary (Long)
            </label>
            <textarea
              name="productSummaryLong"
              value={formData.productSummaryLong}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent"
              placeholder="Detailed product description..."
              maxLength={500}
            />
            <p className="text-xs text-[#64748B] mt-1">
              {formData.productSummaryLong.length}/500 characters
            </p>
          </div>

          {/* Customer References Section - Only show in edit mode */}
          {mode === 'edit' && company && (
            <div className="mt-8 border-t border-[#E2E8F0] pt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-[#0F172A]">Customer References</h3>
                  <p className="text-sm text-[#64748B] mt-1">
                    Add customer references to build trust and verify segments
                  </p>
                </div>
                <div className="relative group">
                  <Info className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                  <div className="absolute right-0 top-6 z-50 w-96 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-4 mt-2 shadow-xl">
                      <p className="font-semibold mb-2">Verification Request Email:</p>
                      <div className="space-y-2 text-gray-200">
                        <p><span className="text-gray-400">Subject:</span> Verification request from [Company Name]</p>
                        <p>Dear [FirstName],</p>
                        <p>[Company] has listed you as a reference customer on the STR Market Map. Could you please confirm that you are a satisfied customer of [Company] within the [Segment Name] category?</p>
                        <p>Please reply to this email with 'Yes' or click the [Confirm] button below.</p>
                        <p>It would also mean a lot to [Company] if you could leave a quick review.</p>
                        <p className="pt-2">Best regards,<br />The STR Market Map Team</p>
                      </div>
                      <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>

              {loadingReferences ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0] mx-auto"></div>
                  <p className="text-sm text-[#64748B] mt-2">Loading references...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {SEGMENTS.map((segment) => {
                    const segmentReferences = getReferencesBySegment(segment);
                    const confirmedCount = getConfirmedCount(segment);

                    return (
                      <div key={segment} className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                        {/* Segment Header */}
                        <div className="bg-[#F8FAFC] p-4 border-b border-[#E2E8F0]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-medium text-[#0F172A]">{segment}</h4>
                                <p className="text-sm text-[#64748B] mt-1">
                                  {confirmedCount} confirmed {confirmedCount === 1 ? 'reference' : 'references'}
                                  {confirmedCount >= 2 && (
                                    <span className="ml-2 text-green-600 flex items-center gap-1 inline-flex">
                                      <Check className="w-4 h-4" /> Verified
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className={`text-sm font-medium px-3 py-1 rounded-lg ${
                              confirmedCount >= 2
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {confirmedCount >= 2 ? "Verified" : "Pending Confirmation"}
                            </span>
                          </div>
                        </div>

                        {/* References List */}
                        <div className="p-4">
                          {segmentReferences.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {segmentReferences.map((ref) => (
                                <div key={ref.id} className={`border rounded-lg p-4 ${
                                  ref.status === "confirmed"
                                    ? "border-green-200 bg-green-50"
                                    : "border-gray-200 bg-gray-50"
                                }`}>
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        ref.status === "confirmed" ? "bg-green-500" : "bg-yellow-500"
                                      }`}></div>
                                      <span className={`text-sm font-medium ${
                                        ref.status === "confirmed" ? "text-green-800" : "text-yellow-800"
                                      }`}>
                                        {ref.status === "confirmed" ? "Confirmed" : "Pending"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReference(ref.id)}
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-xs text-[#64748B]">Customer Name</p>
                                      <p className="text-sm font-medium text-[#0F172A]">{ref.customer_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-[#64748B]">Company Name</p>
                                      <p className="text-sm text-[#0F172A]">{ref.company_name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <p className="text-xs text-[#64748B]">Email</p>
                                        <p className="text-sm text-[#2B6CB0] truncate">{ref.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-[#64748B]">Website</p>
                                        <p className="text-sm text-[#2B6CB0] truncate">{ref.website || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Add Reference Button */}
                              {segmentReferences.length < 5 && (
                                <div
                                  className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group"
                                  onClick={() => openAddReferenceModal(segment)}
                                >
                                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                                    <Plus className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <h4 className="font-medium text-gray-900 mb-1">Add Reference</h4>
                                  <p className="text-sm text-gray-500">Add another customer reference</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Building className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                              <p className="text-[#64748B] mb-4">No references added for this segment</p>
                              <button
                                type="button"
                                onClick={() => openAddReferenceModal(segment)}
                                className="inline-flex items-center gap-2 text-[#2B6CB0] hover:text-[#2c5282] font-medium"
                              >
                                <Plus className="w-4 h-4" />
                                Add Reference
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-[#CBD5E1] text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#2B6CB0] text-white rounded-lg hover:bg-[#2c5282] font-medium flex items-center justify-center"
            >
              {mode === 'edit' ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Reference Modal */}
      <AddReferenceModal
        isOpen={showAddReferenceModal}
        onClose={() => {
          setShowAddReferenceModal(false);
          setSelectedSegment('');
        }}
        onSave={handleAddReference}
        segment={selectedSegment}
      />
    </div>
  );
};

export default AddCompanyLeadModal;
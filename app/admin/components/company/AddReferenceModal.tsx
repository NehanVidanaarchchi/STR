'use client';

import React, { useState } from 'react';
import { X, User, Building, Mail, Globe } from 'lucide-react';

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    customerName: string;
    companyName: string;
    email: string;
    website: string;
  }) => void;
  segment: string;
}

const AddReferenceModal = ({ isOpen, onClose, onSave, segment }: AddReferenceModalProps) => {
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    email: '',
    website: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      setFormData({
        customerName: '',
        companyName: '',
        email: '',
        website: '',
      });
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-[#00000069] bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">Add Customer Reference</h3>
            <p className="text-sm text-[#64748B] mt-1">
              Segment: <span className="font-medium text-[#2B6CB0]">{segment}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1 hover:bg-[#F1F5F9] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              <User className="inline w-4 h-4 mr-1" />
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] ${
                errors.customerName ? 'border-red-300' : 'border-[#CBD5E1]'
              }`}
              placeholder="John Doe"
            />
            {errors.customerName && (
              <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              <Building className="inline w-4 h-4 mr-1" />
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] ${
                errors.companyName ? 'border-red-300' : 'border-[#CBD5E1]'
              }`}
              placeholder="Acme Inc."
            />
            {errors.companyName && (
              <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] ${
                errors.email ? 'border-red-300' : 'border-[#CBD5E1]'
              }`}
              placeholder="john@acme.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              <Globe className="inline w-4 h-4 mr-1" />
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] ${
                errors.website ? 'border-red-300' : 'border-[#CBD5E1]'
              }`}
              placeholder="https://acme.com"
            />
            {errors.website && (
              <p className="text-red-500 text-xs mt-1">{errors.website}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#CBD5E1] text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#2B6CB0] text-white rounded-lg hover:bg-[#2c5282] font-medium"
            >
              Add Reference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReferenceModal;
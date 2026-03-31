"use client";

import { X, User, Building, Mail, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

interface AddReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reference: {
    customerName: string;
    companyName: string;
    email: string;
    website: string;
  }) => void;
  segment: string;
  disabled?: boolean;
}

export default function AddReferenceModal({ isOpen, onClose, onSave, segment }: AddReferenceModalProps) {
  const [newReference, setNewReference] = useState({
    customerName: "",
    companyName: "",
    email: "",
    website: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewReference(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (newReference.customerName && newReference.companyName && newReference.email) {
      onSave(newReference);
      setNewReference({
        customerName: "",
        companyName: "",
        email: "",
        website: ""
      });
    }
  };

  const handleClose = () => {
    setNewReference({
      customerName: "",
      companyName: "",
      email: "",
      website: ""
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000069] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add Customer Reference</h3>
              <p className="text-sm text-gray-600 mt-1">For segment: {segment}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Name *
                </div>
              </label>
              <input
                type="text"
                name="customerName"
                value={newReference.customerName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company Name *
                </div>
              </label>
              <input
                type="text"
                name="companyName"
                value={newReference.companyName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Customer Email *
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={newReference.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Website URL
                </div>
              </label>
              <input
                type="url"
                name="website"
                value={newReference.website}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="https://company.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!newReference.customerName || !newReference.companyName || !newReference.email}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Reference
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { X, Mail } from "lucide-react";
import { useEffect, useState } from "react";

interface FieldRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: {
    featureCategoryId: string;
    fieldName: string;
    fieldDescription: string;
    contactEmail: string;
  }) => void;
}
type FeatureCategory = {
  id: string;
  name: string;
};

export default function FieldRequestModal({ isOpen, onClose, onSubmit }: FieldRequestModalProps) {
  const [fieldRequest, setFieldRequest] = useState({
    featureCategoryId: "",
    fieldName: "",
    fieldDescription: "",
    contactEmail: ""
  });

  const [categories, setCategories] = useState<FeatureCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/feature-categories", { cache: "no-store" });
        const json = await res.json();
        setCategories(json.data || []);
      } catch (e) {
        console.error("Failed to load feature categories", e);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFieldRequest(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (fieldRequest.fieldName && fieldRequest.fieldDescription && fieldRequest.contactEmail) {
      onSubmit(fieldRequest);
      setFieldRequest({
        featureCategoryId: "",
        fieldName: "",
        fieldDescription: "",
        contactEmail: ""
      });
    }
  };

  const handleClose = () => {
    setFieldRequest({
      featureCategoryId: "",
      fieldName: "",
      fieldDescription: "",
      contactEmail: ""
    });
    onClose();
  };

  if (!isOpen) return null;

  const isDisabled =
    !fieldRequest.featureCategoryId ||
    !fieldRequest.fieldName ||
    !fieldRequest.fieldDescription ||
    !fieldRequest.contactEmail;

  return (
    <div className="fixed inset-0 bg-[#00000069] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#0F172A]">Request New Form Field</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-[#64748B] mb-6">
            We need a short description of the field you'd like to add, the field name, and your contact info for any follow-up questions.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Feature Category *
              </label>
              <select
                name="featureCategoryId"
                value={fieldRequest.featureCategoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A]"
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? "Loading categories..." : "Select category"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Field Name *
              </label>
              <input
                type="text"
                name="fieldName"
                value={fieldRequest.fieldName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A]"
                placeholder="Enter field name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Field Description (Short) *
              </label>
              <textarea
                rows={3}
                name="fieldDescription"
                value={fieldRequest.fieldDescription}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A] resize-none"
                placeholder="Describe what this field is for"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Contact Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="contactEmail"
                  value={fieldRequest.contactEmail}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A]"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-4">
              <span className="font-medium">Note:</span> We'll use this if we have follow-up questions
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!fieldRequest.fieldName || !fieldRequest.fieldDescription || !fieldRequest.contactEmail}
                className="px-6 py-2 bg-[#2B6CB0] text-white font-medium rounded-lg hover:bg-[#255796] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
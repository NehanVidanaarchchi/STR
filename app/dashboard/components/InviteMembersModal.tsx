'use client';
import { useEffect, useState } from 'react';
import {
  User, Bell, Eye, Users, Shield, Key,
  AlertTriangle, Trash2, Mail, BarChart,
  Globe, Plus, Check, X, Settings as SettingsIcon,
  Edit, UserPlus, X as XIcon
} from 'lucide-react';

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { name: string; email: string; role: string }) => void;
  editMember?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  editMember,
}: InviteMemberModalProps) {

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editMember) {
      onInvite({ name, email, role }); // reuse handler
    } else {
      onInvite({ name, email, role });
    }

    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    if (editMember) {
      setName(editMember.name);
      setEmail(editMember.email);
      setRole(editMember.role);
    }
  }, [editMember]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000069] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {editMember ? 'Edit Team Member' : 'Invite Team Member'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Send an invitation to join your team</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition mb-4"
                placeholder="John Doe"
                required
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </div>
              </label>
              <input
                type="email"
                value={email}
                disabled={!!editMember}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="member@company.com"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Permission Level
                </div>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-700', activeColor: 'border-gray-400 !shadow-none bg-gray-50' },
                  { value: 'Editor', label: 'Editor', color: 'bg-blue-100 text-blue-700', activeColor: 'border-blue-400 !shadow-none bg-blue-50' },
                  { value: 'Admin', label: 'Admin', color: 'bg-yellow-100 text-yellow-700', activeColor: 'border-yellow-400 !shadow-none bg-yellow-50' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`px-4 py-3 border rounded-xl text-sm font-medium text-center transition-all ${role === option.value
                      ? `border-2 ${option.activeColor} ring-1 ring-offset-1 ring-opacity-50`
                      : `border-gray-200 ${option.color} hover:border-gray-300 hover:opacity-90`
                      }`}
                    onClick={() => setRole(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Role Descriptions */}
              <div className="mt-4 space-y-2">
                {role === 'Admin' && (
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <strong>Admin:</strong> Full access to all features including team management, billing, and account deletion
                  </p>
                )}
                {role === 'Editor' && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <strong>Editor:</strong> Can edit company profile, products, and integrations. Cannot manage team or billing
                  </p>
                )}
                {role === 'Viewer' && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <strong>Viewer:</strong> Read-only access to view analytics and company information
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
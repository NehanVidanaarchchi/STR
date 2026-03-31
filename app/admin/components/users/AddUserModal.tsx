import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Lock } from 'lucide-react';

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: AdminUser) => void;
  user?: AdminUser | null;
  mode?: 'add' | 'edit';
}

interface FormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  is_active: boolean;
}

const AddUserModal = ({ isOpen, onClose, onSave, user, mode = 'add' }: AddUserModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        is_active: user.is_active,
      });
    } else {
      // Reset form when adding new
      setFormData({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (mode === 'add') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // For edit mode, password is optional
      if (formData.password) {
        if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const url = '/api/admin-users';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      const payload: any = {
        full_name: formData.full_name,
        email: formData.email,
        is_active: formData.is_active,
      };
      
      if (mode === 'edit') {
        payload.id = user?.id;
        if (formData.password) {
          payload.password = formData.password;
        }
      } else {
        payload.password = formData.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }
      
      onSave(result.data);
      handleClose();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClose = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      is_active: true,
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#00000069] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">
              {mode === 'edit' ? 'Edit Admin User' : 'Add New Admin User'}
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              {mode === 'edit' ? 'Update admin user information' : 'Add a new administrator to the system'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1 hover:bg-[#F1F5F9] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${
                  errors.full_name ? 'border-red-300' : 'border-[#CBD5E1]'
                }`}
                placeholder="Enter full name"
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-[#CBD5E1]'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                {mode === 'edit' ? 'New Password (optional)' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-[#CBD5E1]'
                  }`}
                  placeholder={mode === 'edit' ? "Leave blank to keep current" : "Enter password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              {mode === 'edit' && (
                <p className="text-xs text-[#64748B] mt-1">
                  Leave blank to keep current password
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            {(mode === 'add' || formData.password) && (
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-[#CBD5E1]'
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B]"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Status Field */}
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                <Shield className="inline w-4 h-4 mr-1" />
                Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === true}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                    className="w-4 h-4 text-[#2B6CB0] focus:ring-[#2B6CB0]"
                  />
                  <span className="ml-2 text-sm text-[#0F172A]">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_active"
                    checked={formData.is_active === false}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                    className="w-4 h-4 text-[#2B6CB0] focus:ring-[#2B6CB0]"
                  />
                  <span className="ml-2 text-sm text-[#0F172A]">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-8">
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
              {mode === 'edit' ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
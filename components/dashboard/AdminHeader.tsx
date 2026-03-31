import React from 'react';
import { Shield } from 'lucide-react';

const AdminHeader = () => {
  return (
    <div className="space-y-8">
      {/* Title and Description */}
      <div>
        <h1 className="text-[32px] leading-[40px] font-medium text-[#0F172A]">Admin Dashboard</h1>
        <p className="text-[16px] leading-[24px] text-[#64748B] mt-2">
          Manage users, providers, and monitor platform performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-4">
        <div className="bg-white rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[13px] leading-[18px] text-[#64748B]">Total Users</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] text-green-600">
              <span className="text-[22px] leading-[28px] font-medium text-[#0F172A]">2,548</span>
            </span>
          </div>
          <p className="text-[11px] leading-[16px] text-[#94A3B8] mt-1">0</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-[13px] leading-[18px] text-[#64748B]">Total Leads</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] text-green-600">
              <span className="text-[22px] leading-[28px] font-medium text-[#0F172A]">1,234</span>
            </span>
          </div>
          <p className="text-[11px] leading-[16px] text-[#94A3B8] mt-1">+8% from last month</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-[13px] leading-[18px] text-[#64748B]">Company Leads</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] text-blue-600">
              <span className="text-[22px] leading-[28px] font-medium text-[#0F172A]">89</span>
            </span>
          </div>
          <p className="text-[11px] leading-[16px] text-[#94A3B8] mt-1">Active this week</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Shield className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-[13px] leading-[18px] text-[#64748B]">Pending Submissions</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] text-yellow-600">
              <span className="text-[22px] leading-[28px] font-medium text-[#0F172A]">23</span>
            </span>
          </div>
          <p className="text-[11px] leading-[16px] text-[#94A3B8] mt-1">Require review</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-[13px] leading-[18px] text-[#64748B]">Pending Reviews</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] text-red-600">
              <span className="text-[22px] leading-[28px] font-medium text-[#0F172A]">15</span>
            </span>
          </div>
          <p className="text-[11px] leading-[16px] text-[#94A3B8] mt-1">Awaiting moderation</p>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
'use client';
import { useEffect, useState } from 'react';
import {
  User, Bell, Eye, Users, Shield, Key,
  AlertTriangle, Trash2, Mail, BarChart,
  Globe, Plus, Check, X, Settings as SettingsIcon,
  UserPlus,
  Edit
} from 'lucide-react';
import { InviteMemberModal } from '../components/InviteMembersModal';
import { useRouter } from 'next/navigation';
import { checkPermission } from '@/lib/roles';

export default function SettingsPage() {
  const [leadNotifications, setLeadNotifications] = useState(true);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  // Get user role and handle access control
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role || 'Viewer');

          // Immediate redirect for Viewers
          if (data.role === 'Viewer') {
            router.replace('/dashboard');
            return;
          }
        } else {
          // If not authenticated, redirect to login
          router.replace('/auth/login');
          return;
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        router.replace('/auth/login');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    getUserRole();
  }, [router]);

  const handleInviteMember = async (data: any) => {
    try {
      const res = editingMember
        ? await fetch(`/api/team/members/${editingMember.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            role: data.role,
          }),
        })
        : await fetch('/api/team/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: data.name,
            email: data.email,
            role: data.role,
          }),
        });

      if (!res.ok) throw new Error('Action failed');

      await fetchMembers();
      setEditingMember(null);
      alert(editingMember ? 'Member updated' : 'Invitation sent');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setShowInviteModal(true);
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team/members');
      if (!res.ok) throw new Error('Failed to fetch members');

      const data = await res.json();
      const normalized = data.map((m: any) => ({
        id: m.id,
        name: m.full_name,
        email: m.email,
        role: m.role.charAt(0).toUpperCase() + m.role.slice(1).toLowerCase(),
        status: m.status === 'invited' ? 'Pending' : 'Active',
      }));

      setTeamMembers(normalized);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'Admin') {
      fetchMembers();
    }
  }, [userRole]);

  const handleRemoveMember = async (id: string) => {
    // Check permission
    if (!checkPermission(userRole, 'canManageTeam')) {
      alert('You do not have permission to remove team members');
      return;
    }

    if (!confirm('Remove this member?')) return;

    try {
      const res = await fetch(`/api/team/members/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove member');

      setTeamMembers(prev => prev.filter(m => m.id !== id));
      alert('Member removed successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to remove member');
    }
  };

  const handleUnpublishProfile = () => {
    // Check permission
    if (!checkPermission(userRole, 'canPublishProfile')) {
      alert('You do not have permission to unpublish profile');
      return;
    }

    if (confirm('Are you sure you want to unpublish your profile? This will hide your company from the marketplace.')) {
      setPublicProfile(false);
      // TODO: Call API to unpublish
    }
  };

  const handleDeleteAccount = () => {
    // Check permission
    if (!checkPermission(userRole, 'canDeleteAccount')) {
      alert('You do not have permission to delete account');
      return;
    }

    if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      alert('Account deletion requested. This would trigger account deletion process.');
      // TODO: Call API to delete account
    }
  };

  const handleToggleSetting = (setting: string, currentValue: boolean) => {
    // Check permission for profile settings
    if (!checkPermission(userRole, 'canEditProfile') && setting.includes('profile')) {
      alert('You do not have permission to modify profile settings');
      return;
    }

    // Update the specific setting
    if (setting === 'leadNotifications') setLeadNotifications(!currentValue);
    if (setting === 'weeklyAnalytics') setWeeklyAnalytics(!currentValue);
    if (setting === 'publicProfile') setPublicProfile(!currentValue);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If userRole is Viewer or empty after loading, show unauthorized
  if (!userRole || userRole === 'Viewer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">403</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You do not have permission to access this page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'Admin';
  const isEditor = userRole === 'Editor';
  const canEditProfile = checkPermission(userRole, 'canEditProfile');
  const canManageTeam = checkPermission(userRole, 'canManageTeam');
  const canDeleteAccount = checkPermission(userRole, 'canDeleteAccount');
  const canPublishProfile = checkPermission(userRole, 'canPublishProfile');

  return (
    <div className="space-y-8">
      {/* Account Settings Section - Available for Admin & Editor */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-[#0F172A]">Account Settings</h2>
        </div>

        {/* Notification Preferences */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
          </div>

          <div className="space-y-6">
            {/* Lead Notifications */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Lead Notifications</h4>
                </div>
                <p className="text-sm text-gray-600 ml-7">Email alerts for new leads and inquiries</p>
              </div>
              <button
                onClick={() => handleToggleSetting('leadNotifications', leadNotifications)}
                disabled={!canEditProfile}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${leadNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${leadNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* Weekly Analytics Report */}
          </div>
        </div>

        {/* Profile Visibility - Only for Admin & Editor */}
        {canEditProfile && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Profile Visibility</h3>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Public Profile</h4>
                </div>
                <p className="text-sm text-gray-600 ml-7">Show your company in marketplace</p>
              </div>
              <button
                onClick={() => handleToggleSetting('publicProfile', publicProfile)}
                disabled={!canPublishProfile}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${publicProfile ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${publicProfile ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team Members & Permissions Section - Only for Admin */}
      {canManageTeam && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A]">Team Members & Permissions</h2>
          </div>

          {/* Team Members */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
              </div>
              <button
                onClick={() => {
                  setEditingMember(null);
                  setShowInviteModal(true);
                }}
                disabled={!canManageTeam}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-600">{member.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${member.role === 'Admin'
                              ? 'bg-yellow-100 text-yellow-800'
                              : member.role === 'Editor'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            <div className="flex items-center gap-1">
                              {member.status === 'Active' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              )}
                              {member.status === 'Pending' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                              )}
                              {member.status}
                            </div>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {member.role !== 'Admin' && canManageTeam && (
                            <>
                              <button
                                onClick={() => openEditModal(member)}
                                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                                title="Edit member"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Permission Levels */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Permission Levels</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Admin Card */}
              <div className="border border-yellow-200 rounded-xl p-6 bg-yellow-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Key className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Admin</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Full access to all features including team management, billing, and account deletion
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Full system access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Team management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Billing & settings</span>
                  </div>
                </div>
              </div>

              {/* Editor Card */}
              <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <SettingsIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Editor</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Can edit company profile, products, and integrations. Cannot manage team or billing
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Edit profile & products</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Manage integrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-gray-700">Team management</span>
                  </div>
                </div>
              </div>

              {/* Viewer Card */}
              <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Eye className="w-5 h-5 text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Viewer</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Read-only access to view analytics and company information
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">View analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Read company info</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-gray-700">Edit any content</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone Section - Only for Admin */}
      {canDeleteAccount && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A]">Danger Zone</h2>
          </div>

          <div className="space-y-8">
            {/* Unpublish Profile */}
            {canPublishProfile && (
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-red-200 rounded-lg bg-[#ffffff5e]">
                <div className="mb-4 md:mb-0">
                  <h4 className="font-medium text-gray-900 mb-1">Unpublish Profile</h4>
                  <p className="text-sm text-gray-600">Hide your profile from the marketplace</p>
                </div>
                <button
                  onClick={handleUnpublishProfile}
                  className="px-6 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium whitespace-nowrap"
                >
                  Unpublish
                </button>
              </div>
            )}

            {/* Delete Account */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-red-200 rounded-lg bg-[#ffffff5e]">
              <div className="mb-4 md:mb-0">
                <h4 className="font-medium text-gray-900 mb-1">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your company profile</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal - Only for Admin */}
      {canManageTeam && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setEditingMember(null);
          }}
          onInvite={handleInviteMember}
          editMember={editingMember}
        />
      )}
    </div>
  );
}
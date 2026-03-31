// Simple role-based checks
export const ROLES = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Simple permission checks (add more as needed)
export const checkPermission = (userRole: string, action: string): boolean => {
  const role = userRole as Role;
  
  const permissions: Record<Role, string[]> = {
    Admin: [
      'canEditCompany',
      'canManageTeam',
      'canInviteMembers',
      'canRemoveMembers',
      'canDeleteAccount',
      'canPublishProfile',
      'canManageBilling',
      'canViewSettings',
      'canEditSettings',
      'canUploadAssets',
      'canManageReferences',
      'canViewAnalytics',
    ],
    Editor: [
      'canEditCompany',
      'canUploadAssets',
      'canManageReferences',
      'canViewSettings',
      'canEditSettings',
      'canViewAnalytics',
    ],
    Viewer: [
      'canViewSettings',
    ],
  };

  return permissions[role]?.includes(action) || false;
};

// Check if role can access a path
export const canAccessPath = (role: string, path: string): boolean => {
  const pathPermissions: Record<string, Role[]> = {
    '/settings': ['Admin', 'Editor', 'Viewer'],
    '/settings/team': ['Admin'],
    '/settings/billing': ['Admin'],
    '/company/profile': ['Admin', 'Editor'],
    '/dashboard': ['Admin', 'Editor', 'Viewer'],
    '/dashboard/analytics': ['Admin', 'Editor'],
  };

  const allowedRoles = pathPermissions[path] || ['Admin', 'Editor', 'Viewer'];
  return allowedRoles.includes(role as Role);
};
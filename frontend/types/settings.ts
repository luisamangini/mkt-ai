export type SettingsTab = "users" | "permissions";

export type UserRole = "admin" | "editor" | "viewer";

export type UserStatus = "active" | "inactive";

export interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastAccess: string;
  status: UserStatus;
}

export interface PermissionRow {
  feature: string;
  admin: boolean;
  editor: boolean;
  viewer: boolean;
}

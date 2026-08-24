export type SettingsTab = "users" | "account";

export type CurrentAccount = {
  email: string;
  name: string;
};

export type SettingsUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
};

export type InviteUserInput = {
  email: string;
};

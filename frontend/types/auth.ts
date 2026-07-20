export type MockAuthRole = "Admin" | "Editor";

export interface MockAuthUser {
  name: string;
  email: string;
  role: MockAuthRole;
}

export interface MockAuthCredential extends MockAuthUser {
  password: string;
}

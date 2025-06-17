export interface CreateUserData {
  name: string;
  email: string;
  role: string;
  department: string;
  avatarUrl?: string;
}

export type Role = 'User' | 'Admin' | 'Presidente' | 'Electromedicina';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  picture?: string;
  email_verified?: boolean;
  sub?: string; // Auth0 user ID
  updated_at?: string;
  created_at?: string;
  displayId?: string;
  avatarUrl?: string;
  emailOnNewTicket?: boolean;
  emailOnNewComment?: boolean;
  customAppName?: string;
} 
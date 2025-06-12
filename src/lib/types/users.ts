import { Role } from '@prisma/client';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  displayId?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
} 
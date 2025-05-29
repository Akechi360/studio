
"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logAuditEvent } from "@/lib/actions"; // This action will also need Prisma integration

// --- Prisma Client (placeholder, real client to be initialized elsewhere and imported) ---
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient(); // This should be a singleton instance, typically in a separate db.ts file

// --- Mock Users Store (To be removed/replaced by database) ---
// declare global {
//   // eslint-disable-next-line no-var
//   var __mock_users_store_auth__: User[] | undefined;
// }

// let usersStore_auth_internal: User[];

// Placeholder: Initial users that would be seeded into the database
const initialAdminUser: Omit<User, 'id' | 'password'> & {password: string} = {
  name: "Sistemas ClinicaIEQ",
  email: "sistemas@clinicaieq.com",
  role: "Admin",
  avatarUrl: "https://placehold.co/100x100.png?text=SC",
  department: "Sistemas",
  password: "adminpassword" // In a real app, seed with a hashed password
};

const presidenteUser: Omit<User, 'id' | 'password'> & {password: string} = {
  name: "Presidente IEQ",
  email: "presidente@clinicaieq.com",
  role: "PresidenteIEQ",
  avatarUrl: "https://placehold.co/100x100.png?text=PI",
  department: "Presidente",
  password: "presidentepassword", // In a real app, seed with a hashed password
};

const additionalApproversSeedData = [
  { name: "Margarita Malek", email: "proveedoresvarios@clinicaieq.com", role: "User" as Role, department: "Tesoreria", password: "123456789", avatarUrl: "https://placehold.co/100x100.png?text=MM" },
  { name: "Carolina Ramirez", email: "gerencia_administracion@clinicaieq.com", role: "User" as Role, department: "Gerencia", password: "123456789", avatarUrl: "https://placehold.co/100x100.png?text=CR" },
  { name: "Emilia Valderrama", email: "electromedicina@clinicaieq.com", role: "User" as Role, department: "Equipos Medicos", password: "123456789", avatarUrl: "https://placehold.co/100x100.png?text=EV" },
  { name: "Cesar Gil", email: "gerencia_sistemas@clinicaieq.com", role: "User" as Role, department: "Gerencia Sistemas", password: "123456789", avatarUrl: "https://placehold.co/100x100.png?text=CG" },
  { name: "Pina Aulino", email: "suministros@clinicaieq.com", role: "User" as Role, department: "Suministros", password: "123456789", avatarUrl: "https://placehold.co/100x100.png?text=PA" },
];


// if (process.env.NODE_ENV === 'production') {
//   // In production, data comes from the DB, not a global mock store.
//   // This initialization logic here is effectively removed.
//   usersStore_auth_internal = []; // This was for mock, will be empty.
// } else {
//   if (!global.__mock_users_store_auth__) {
//     // Initialize with seed data for dev if the global store isn't set.
//     // This is a simplified version of seeding for the mock context.
//     global.__mock_users_store_auth__ = [
//       { ...initialAdminUser, id: "admin-user-001" },
//       { ...presidenteUser, id: "presidente-user-001"},
//       ...additionalApproversSeedData.map((u, i) => ({ ...u, id: `approver-user-00${i+1}`}))
//     ];
//   }
//   usersStore_auth_internal = global.__mock_users_store_auth__;
// }
// --- End Mock Users Store ---

export const SPECIFIC_APPROVER_EMAILS = additionalApproversSeedData.map(u => u.email);

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  updateSelfPassword: (newPassword: string) => Promise<boolean>;
  resetPasswordByEmail: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  getAllUsers: () => Promise<User[]>; // Now async as it will fetch from DB
  updateUserByAdmin: (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>) => Promise<{ success: boolean; message?: string }>;
  deleteUserByAdmin: (userId: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // TODO: Implement session checking with the backend/database
    // For now, we'll try to load from localStorage but this is not secure for a real app.
    // In a Prisma setup, you'd likely verify a session token against the database.
    try {
      const storedUserJson = localStorage.getItem("ticketflow_user");
      if (storedUserJson) {
        const parsedUserFromStorage = JSON.parse(storedUserJson) as User;
        // TODO: Validate this user against the database, not a mock store.
        // For now, just set it if it exists to maintain some flow.
        setUser(parsedUserFromStorage);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("ticketflow_user");
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    // TODO: Implement login with Prisma client
    // 1. Find user by email.
    // 2. Compare hashed password (use bcrypt.compare).
    // 3. If valid, set user state and store session (e.g., in a cookie or localStorage for this demo).
    console.warn("Login function needs Prisma implementation.");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    // Placeholder logic to allow login with seeded admin for now
    if (email === initialAdminUser.email && pass === initialAdminUser.password) {
        const loggedInUser: User = { ...initialAdminUser, id: "admin-user-001-db" }; // Simulate DB ID
        setUser(loggedInUser);
        localStorage.setItem("ticketflow_user", JSON.stringify(loggedInUser));
        setIsLoading(false);
        return true;
    }
     if (email === presidenteUser.email && pass === presidenteUser.password) {
        const loggedInUser: User = { ...presidenteUser, id: "presidente-user-001-db" };
        setUser(loggedInUser);
        localStorage.setItem("ticketflow_user", JSON.stringify(loggedInUser));
        setIsLoading(false);
        return true;
    }
    // Check additional approvers
    const approver = additionalApproversSeedData.find(u => u.email === email && u.password === pass);
    if (approver) {
        const loggedInUser: User = { ...approver, id: `approver-${approver.email}-db` };
        setUser(loggedInUser);
        localStorage.setItem("ticketflow_user", JSON.stringify(loggedInUser));
        setIsLoading(false);
        return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    if (user?.email) {
       logAuditEvent(user.email, "Cierre de Sesión"); // This will also need Prisma
    }
    setUser(null);
    localStorage.removeItem("ticketflow_user"); // Simple localStorage session removal
    router.push("/login");
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    // TODO: Implement registration with Prisma client
    // 1. Check if email already exists.
    // 2. Hash the password (use bcrypt).
    // 3. Create new user in the database.
    // 4. Set user state and session.
    console.warn("Register function needs Prisma implementation.");
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    return false; // Simulate failure until implemented
  };

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    // TODO: Implement profile update with Prisma client
    // 1. Ensure new email isn't taken by another user (if email is changeable).
    // 2. Update user record in the database.
    // 3. Update local user state and session.
    console.warn("updateProfile function needs Prisma implementation.");
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    return false; // Simulate failure
  };

  const updateSelfPassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    // TODO: Implement password update with Prisma client
    // 1. Hash the newPassword.
    // 2. Update user's password in the database.
    console.warn("updateSelfPassword function needs Prisma implementation.");
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    return false; // Simulate failure
  };

  const resetPasswordByEmail = async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    // TODO: Implement password reset with Prisma client
    // 1. Find user by email.
    // 2. If found, hash newPassword and update in DB.
    console.warn("resetPasswordByEmail function needs Prisma implementation.");
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    return { success: false, message: "Funcionalidad no implementada con base de datos." };
  };

  const updateUserByAdmin = async (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== "Admin") {
      return { success: false, message: "Acción no permitida." };
    }
    // TODO: Implement user update by admin with Prisma client
    console.warn("updateUserByAdmin function needs Prisma implementation.");
    return { success: false, message: "Funcionalidad no implementada con base de datos." };
  };

  const deleteUserByAdmin = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== "Admin") {
      return { success: false, message: "Acción no permitida." };
    }
    // TODO: Implement user deletion by admin with Prisma client
    console.warn("deleteUserByAdmin function needs Prisma implementation.");
    return { success: false, message: "Funcionalidad no implementada con base de datos." };
  };

  const getAllUsers = async (): Promise<User[]> => {
    // TODO: Implement fetching all users with Prisma client
    console.warn("getAllUsers function needs Prisma implementation.");
    return []; // Return empty array until implemented
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, isLoading, login, logout, register, updateProfile, updateSelfPassword, resetPasswordByEmail, getAllUsers, updateUserByAdmin, deleteUserByAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

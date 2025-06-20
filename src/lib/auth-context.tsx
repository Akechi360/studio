"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import type { User, Role } from "@/lib/types";
import { Loading } from '@/components/ui/loading';
import { 
  getUserByIdServerAction,
  updateUserProfileServerAction,
  getAllUsersServerAction,
  updateUserByAdminServerAction,
  deleteUserByAdminServerAction,
  logAuditEvent
} from "@/lib/actions";

export const SPECIFIC_APPROVER_EMAILS = [
  "proveedoresvarios@clinicaieq.com",
  "gerencia_administracion@clinicaieq.com",
  "electromedicina@clinicaieq.com",
  "gerencia_sistemas@clinicaieq.com",
  "suministros@clinicaieq.com",
];

export const SPECIFIC_INVENTORY_EMAILS = [
  "inventario1@clinicaieq.com",
  "inventario2@clinicaieq.com",
  "sistemas@clinicaieq.com",
];

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  updateProfile: (name: string, email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: auth0User, error, isLoading: auth0IsLoading } = useUser();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (auth0User) {
        try {
          const response = await fetch('/api/user-profile');
          if (response.ok) {
            const dbUser = await response.json();
            setLocalUser(dbUser);
          } else {
            console.error("Failed to fetch local user profile");
            setLocalUser(null);
          }
        } catch (e) {
          console.error("Error syncing user:", e);
          setLocalUser(null);
        }
      } else {
        setLocalUser(null);
      }
      setIsLoading(false);
    };

    if (!auth0IsLoading) {
      syncUser();
    }
  }, [auth0User, auth0IsLoading]);

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!localUser) return false;
    const result = await updateUserProfileServerAction(localUser.id, { name, email });
    if (result.success) {
      setLocalUser(prev => prev ? { ...prev, name, email } : null);
    }
    return result.success;
  };

  const mergedUser = localUser ? {
    ...localUser,
    ...auth0User,
    id: localUser.id,
    role: localUser.role,
    department: localUser.department,
  } : null;

  if (isLoading) {
    return <Loading message="Autenticando..." variant="circles" size="md" className="min-h-screen" />;
  }

  return (
    <AuthContext.Provider value={{ 
      user: mergedUser, 
      role: mergedUser?.role || null, 
      isLoading,
      updateProfile
    }}>
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

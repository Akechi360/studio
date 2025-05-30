
"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { 
  loginUserServerAction,
  registerUserServerAction,
  getUserByIdServerAction,
  updateUserProfileServerAction,
  updateUserPasswordServerAction,
  resetUserPasswordByEmailServerAction,
  getAllUsersServerAction,
  updateUserByAdminServerAction,
  deleteUserByAdminServerAction,
  logAuditEvent // If logAuditEvent is to be called from client context, it needs to be a server action too. Assuming it is.
} from "@/lib/actions";


export const SPECIFIC_APPROVER_EMAILS = [
  "proveedoresvarios@clinicaieq.com",
  "gerencia_administracion@clinicaieq.com",
  "electromedicina@clinicaieq.com",
  "gerencia_sistemas@clinicaieq.com",
  "suministros@clinicaieq.com",
];

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
  getAllUsers: () => Promise<User[]>;
  updateUserByAdmin: (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>) => Promise<{ success: boolean; message?: string }>;
  deleteUserByAdmin: (userId: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      setIsLoading(true);
      try {
        const storedUserJson = localStorage.getItem("ticketflow_user");
        if (storedUserJson) {
          const parsedUserFromStorage = JSON.parse(storedUserJson) as User;
          if (parsedUserFromStorage && parsedUserFromStorage.id) {
             const freshUser = await getUserByIdServerAction(parsedUserFromStorage.id);
             if (freshUser) {
                setUser(freshUser);
             } else {
                localStorage.removeItem("ticketflow_user"); 
                setUser(null);
             }
          } else {
            setUser(null);
          }
        } else {
            setUser(null);
        }
      } catch (error) {
        console.error("Error checking user session:", error);
        localStorage.removeItem("ticketflow_user");
        setUser(null);
      }
      setIsLoading(false);
    };
    checkUserSession();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const result = await loginUserServerAction(email, pass);
    setIsLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem("ticketflow_user", JSON.stringify(result.user));
      return true;
    }
    // logAuditEvent is called within loginUserServerAction
    return false;
  };

  const logout = async () => {
    if (user?.email) {
      await logAuditEvent(user.email, "Cierre de Sesión");
    }
    setUser(null);
    localStorage.removeItem("ticketflow_user");
    router.push("/login");
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const result = await registerUserServerAction(name, email, pass);
    setIsLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem("ticketflow_user", JSON.stringify(result.user));
      return true;
    }
    // logAuditEvent is called within registerUserServerAction
    return false;
  };

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!user || !user.id) return false;
    setIsLoading(true);
    const result = await updateUserProfileServerAction(user.id, name, email);
    setIsLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem("ticketflow_user", JSON.stringify(result.user));
      return true;
    }
    return false;
  };

  const updateSelfPassword = async (newPasswordValue: string): Promise<boolean> => {
    if (!user || !user.id) return false;
    setIsLoading(true);
    const result = await updateUserPasswordServerAction(user.id, newPasswordValue);
    setIsLoading(false);
    return result.success;
  };

  const resetPasswordByEmail = async (email: string, newPasswordValue: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    const result = await resetUserPasswordByEmailServerAction(email, newPasswordValue);
    setIsLoading(false);
    return result;
  };

  const getAllUsers = async (): Promise<User[]> => {
    // setIsLoading(true); // Typically not needed for a simple fetch in admin panel
    const users = await getAllUsersServerAction();
    // setIsLoading(false);
    return users;
  };

  const updateUserByAdmin = async (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== "Admin" || !user.email) {
      return { success: false, message: "Acción no permitida o información del administrador incompleta." };
    }
    setIsLoading(true);
    const result = await updateUserByAdminServerAction(user.email, userId, data);
    setIsLoading(false);
    return result;
  };

  const deleteUserByAdmin = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== "Admin" || !user.email) {
      return { success: false, message: "Acción no permitida o información del administrador incompleta." };
    }
    if (user.id === userId) {
      return { success: false, message: "No puedes eliminar tu propia cuenta de administrador."}
    }
    setIsLoading(true);
    const result = await deleteUserByAdminServerAction(user.email, userId);
    setIsLoading(false);
    return result;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role: user?.role || null, 
      isLoading, 
      login, 
      logout, 
      register, 
      updateProfile, 
      updateSelfPassword, 
      resetPasswordByEmail, 
      getAllUsers, 
      updateUserByAdmin, 
      deleteUserByAdmin 
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

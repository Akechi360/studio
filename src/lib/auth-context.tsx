"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { 
  loginUserServerAction,
  registerUser as createUser,
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

export const SPECIFIC_INVENTORY_EMAILS = [
  "electromedicina@clinicaieq.com",
  "suministros@clinicaieq.com",
  "gerencia_administracion@clinicaieq.com",
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

// Utilidad para limpiar el usuario (null -> undefined)
function cleanUser(user: any): User {
  return {
    ...user,
    avatarUrl: user.avatarUrl ?? undefined,
    department: user.department ?? undefined,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      setIsLoading(true);
      try {
        // Eliminar cualquier referencia a localStorage
        // Siempre obtener el usuario desde la base de datos
        // Si tienes un token de sesión, úsalo aquí para autenticar la petición
        // Por ahora, asumimos que el usuario está autenticado y su id está en memoria
        // Si no hay usuario en memoria, no hay sesión
        // Si tienes un flujo de autenticación basado en cookies o JWT, aquí deberías validar la sesión
        setUser(null); // Por defecto, sin usuario
        // Si tienes un endpoint para obtener el usuario actual autenticado, úsalo aquí
        // Ejemplo: const freshUser = await getCurrentUserServerAction();
        // if (freshUser) setUser(cleanUser(freshUser));
      } catch (error) {
        console.error("Error checking user session:", error);
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
      setUser(cleanUser(result.user));
      // No guardar en localStorage
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (user?.email) {
      await logAuditEvent(user.email, "Cierre de Sesión");
    }
    setUser(null);
    // No eliminar de localStorage
    router.push("/login");
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const user = await createUser(name, email, pass);
      setIsLoading(false);
      if (user) {
        setUser(cleanUser(user));
        return true;
      }
      return false;
    } catch (error) {
      setIsLoading(false);
      console.error("Error en registro:", error);
      return false;
    }
  };

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!user || !user.id) return false;
    setIsLoading(true);
    const result = await updateUserProfileServerAction(user.id, name, email);
    setIsLoading(false);
    if (result.success && result.user) {
      setUser(cleanUser(result.user));
      // No guardar en localStorage
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
    const users = await getAllUsersServerAction();
    // Convertir los usuarios al tipo User esperado
    return users.map(user => ({
      ...user,
      role: user.role as Role,
      avatarUrl: user.avatarUrl || undefined,
      department: user.department || undefined
    }));
  };

  const updateUserByAdmin = async (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== "Admin" || !user.email) {
      return { success: false, message: "Acción no permitida o información del administrador incompleta." };
    }
    setIsLoading(true);
    // Asegurar que los campos requeridos estén presentes
    const updateData = {
      name: data.name || '',
      role: data.role || 'User',
      email: data.email || '',
      department: data.department,
      password: data.password
    };
    const result = await updateUserByAdminServerAction(user.email, userId, updateData);
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


"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logAuditEvent } from "@/lib/actions"; 

// --- Mock Users Store (similar to mock-data.ts pattern) ---
declare global {
  // eslint-disable-next-line no-var
  var __mock_users_store_auth__: User[] | undefined;
}

let usersStore_auth_internal: User[];

const initialAdminUser: User = {
  id: "admin-user-001", 
  name: "Sistemas ClinicaIEQ",
  email: "sistemas@clinicaieq.com",
  role: "Admin",
  avatarUrl: "https://placehold.co/100x100.png?text=SC",
  department: "Sistemas",
  password: "adminpassword" 
};

if (process.env.NODE_ENV === 'production') {
  usersStore_auth_internal = [initialAdminUser];
} else {
  if (!global.__mock_users_store_auth__) {
    global.__mock_users_store_auth__ = [initialAdminUser];
  }
  usersStore_auth_internal = global.__mock_users_store_auth__;
}
// --- End Mock Users Store ---

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
  getAllUsers: () => User[];
  updateUserByAdmin: (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>) => Promise<{ success: boolean; message?: string }>;
  deleteUserByAdmin: (userId: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUserJson = localStorage.getItem("ticketflow_user");
      if (storedUserJson) {
        const parsedUserFromStorage = JSON.parse(storedUserJson) as User;
        // Validate against the current usersStore_auth_internal
        const existingUserInStore = usersStore_auth_internal.find(u => u.id === parsedUserFromStorage.id);
        if (existingUserInStore) {
          // Ensure the user object in context is the one from the store, which might have been updated
          setUser(existingUserInStore); 
        } else {
          // User in localStorage no longer exists or is stale, clear it
          localStorage.removeItem("ticketflow_user");
          setUser(null); 
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("ticketflow_user");
    }
    setIsLoading(false);
  }, []); // Run once on mount to load user state

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = usersStore_auth_internal.find(u => u.email === email && u.password === pass);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("ticketflow_user", JSON.stringify(foundUser));
      setIsLoading(false);
      // await logAuditEvent(foundUser.email, "Inicio de Sesión Exitoso");
      return true;
    }
    setIsLoading(false);
    // await logAuditEvent(email, "Intento de Inicio de Sesión Fallido");
    return false;
  };

  const logout = () => {
    if (user?.email) { 
       logAuditEvent(user.email, "Cierre de Sesión");
    }
    setUser(null);
    localStorage.removeItem("ticketflow_user");
    router.push("/login");
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (usersStore_auth_internal.find(u => u.email === email)) {
      setIsLoading(false);
      return false;
    }
    const newUser: User = {
      id: String(usersStore_auth_internal.length + 1 + Date.now()),
      name,
      email,
      role: "User",
      avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,2).toUpperCase()}`,
      password: pass,
    };
    usersStore_auth_internal.push(newUser); 
    setUser(newUser);
    localStorage.setItem("ticketflow_user", JSON.stringify(newUser));
    setIsLoading(false);
    await logAuditEvent(email, "Registro de Nuevo Usuario", `Usuario: ${name} (${email})`);
    return true;
  };
  
  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const userIndex = usersStore_auth_internal.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      if (email !== usersStore_auth_internal[userIndex].email && usersStore_auth_internal.some(u => u.email === email && u.id !== user.id)) {
        setIsLoading(false);
        return false;
      }
      const oldEmail = usersStore_auth_internal[userIndex].email;
      const oldName = usersStore_auth_internal[userIndex].name;
      const updatedUser = { ...usersStore_auth_internal[userIndex], name, email };
      usersStore_auth_internal[userIndex] = updatedUser;
      setUser(updatedUser);
      localStorage.setItem("ticketflow_user", JSON.stringify(updatedUser));
      setIsLoading(false);
      await logAuditEvent(user.email, "Actualización de Perfil Propio", `De: ${oldName} (${oldEmail}) a ${name} (${email})`);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const updateSelfPassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const userIndex = usersStore_auth_internal.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      const updatedUser = { ...usersStore_auth_internal[userIndex], password: newPassword };
      usersStore_auth_internal[userIndex] = updatedUser;
      setUser(updatedUser);
      localStorage.setItem("ticketflow_user", JSON.stringify(updatedUser));
      setIsLoading(false);
      await logAuditEvent(user.email, "Actualización de Contraseña Propia");
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const resetPasswordByEmail = async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const userIndex = usersStore_auth_internal.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      usersStore_auth_internal[userIndex].password = newPassword;
      setIsLoading(false);
      await logAuditEvent(email, "Restablecimiento de Contraseña (Olvidó Contraseña)", `Contraseña actualizada para ${email}`);
      return { success: true, message: "Contraseña actualizada exitosamente." };
    }
    setIsLoading(false);
    await logAuditEvent(email, "Intento Fallido de Restablecimiento de Contraseña", `Correo no encontrado: ${email}`);
    return { success: false, message: "Correo electrónico no encontrado." };
  };

  const updateUserByAdmin = async (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== "Admin") {
      return { success: false, message: "Acción no permitida." };
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    const userIndex = usersStore_auth_internal.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: "Usuario no encontrado." };
    }

    const targetUserOriginal = { ...usersStore_auth_internal[userIndex] }; 

    if (data.email && data.email !== usersStore_auth_internal[userIndex].email) {
      if (usersStore_auth_internal.some(u => u.email === data.email && u.id !== userId)) {
        return { success: false, message: "El correo electrónico ya está en uso por otro usuario." };
      }
    }
    
    const updatedUserData = { ...usersStore_auth_internal[userIndex], ...data };
    
    if (data.department === "_NO_DEPARTMENT_") {
        updatedUserData.department = undefined;
    } else if (data.department !== undefined) {
        updatedUserData.department = data.department;
    }

    if (data.password && data.password.trim() !== "") {
      updatedUserData.password = data.password;
    } else {
      updatedUserData.password = usersStore_auth_internal[userIndex].password;
    }

    usersStore_auth_internal[userIndex] = updatedUserData;

    let details = `Usuario ID: ${userId}, Nombre: ${targetUserOriginal.name} (${targetUserOriginal.email}). Cambios: `;
    const changes = [];
    if (data.name && data.name !== targetUserOriginal.name) changes.push(`Nombre de '${targetUserOriginal.name}' a '${data.name}'`);
    if (data.email && data.email !== targetUserOriginal.email) changes.push(`Email de '${targetUserOriginal.email}' a '${data.email}'`);
    if (data.role && data.role !== targetUserOriginal.role) changes.push(`Rol de '${targetUserOriginal.role}' a '${data.role}'`);
    if (data.department !== targetUserOriginal.department) changes.push(`Departamento de '${targetUserOriginal.department || "N/A"}' a '${updatedUserData.department || "N/A"}'`);
    if (data.password && data.password.trim() !== "" && data.password !== targetUserOriginal.password) changes.push(`Contraseña actualizada.`);
    details += changes.join(', ') || "Sin cambios detectables en campos principales.";

    if (user.email) { 
        await logAuditEvent(user.email, "Actualización de Usuario por Administrador", details);
    }
    
    if (user && user.id === userId) {
      const updatedSelf = { ...user, ...usersStore_auth_internal[userIndex] };
      setUser(updatedSelf);
      localStorage.setItem("ticketflow_user", JSON.stringify(updatedSelf));
    }
    return { success: true, message: "Usuario actualizado exitosamente." };
  };

  const deleteUserByAdmin = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== "Admin") {
      return { success: false, message: "Acción no permitida." };
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    if (user && user.id === userId) {
      return { success: false, message: "No puedes eliminar tu propia cuenta de administrador." };
    }
    const userIndex = usersStore_auth_internal.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const deletedUserName = usersStore_auth_internal[userIndex].name;
      const deletedUserEmail = usersStore_auth_internal[userIndex].email;
      usersStore_auth_internal.splice(userIndex, 1);
      if (user.email) { 
        await logAuditEvent(user.email, "Eliminación de Usuario por Administrador", `Usuario: ${deletedUserName} (${deletedUserEmail}), ID: ${userId}`);
      }
      return { success: true, message: "Usuario eliminado exitosamente." };
    }
    return { success: false, message: "Usuario no encontrado." };
  };

  const getAllUsers = () => {
    return [...usersStore_auth_internal];
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

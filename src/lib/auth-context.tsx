
"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logAuditEvent } from "@/lib/actions"; // Import the server action

export const mockUsers: User[] = [
  { id: "3", name: "Sistemas ClinicaIEQ", email: "sistemas@clinicaieq.com", role: "Admin", avatarUrl: "https://placehold.co/100x100.png?text=SC", department: "Sistemas", password: "adminpassword" },
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
      const storedUser = localStorage.getItem("ticketflow_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        const existingUser = mockUsers.find(u => u.id === parsedUser.id);
        if (existingUser) {
          setUser(existingUser); 
        } else {
          localStorage.removeItem("ticketflow_user"); 
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("ticketflow_user");
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = mockUsers.find(u => u.email === email && u.password === pass); // Check password for login
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("ticketflow_user", JSON.stringify(foundUser));
      setIsLoading(false);
      // Consider logging successful login attempt if required, though might be noisy
      // await logAuditEvent(foundUser.email, "Inicio de Sesión Exitoso");
      return true;
    }
    setIsLoading(false);
    // Consider logging failed login attempt if required
    // await logAuditEvent(email, "Intento de Inicio de Sesión Fallido");
    return false;
  };

  const logout = () => {
    if (user?.email) { // Log before clearing user
       logAuditEvent(user.email, "Cierre de Sesión");
    }
    setUser(null);
    localStorage.removeItem("ticketflow_user");
    router.push("/login");
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (mockUsers.find(u => u.email === email)) {
      setIsLoading(false);
      return false; 
    }
    const newUser: User = {
      id: String(mockUsers.length + 1 + Date.now()), 
      name,
      email,
      role: "User", 
      avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,2).toUpperCase()}`,
      password: pass, 
    };
    mockUsers.push(newUser); 
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
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      if (email !== mockUsers[userIndex].email && mockUsers.some(u => u.email === email && u.id !== user.id)) {
        setIsLoading(false);
        return false;
      }
      const oldEmail = mockUsers[userIndex].email;
      const oldName = mockUsers[userIndex].name;
      const updatedUser = { ...mockUsers[userIndex], name, email };
      mockUsers[userIndex] = updatedUser;
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
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      const updatedUser = { ...mockUsers[userIndex], password: newPassword };
      mockUsers[userIndex] = updatedUser;
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
    const userIndex = mockUsers.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      mockUsers[userIndex].password = newPassword;
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
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: "Usuario no encontrado." };
    }

    const targetUserOriginal = { ...mockUsers[userIndex] }; // For logging changes

    if (data.email && data.email !== mockUsers[userIndex].email) {
      if (mockUsers.some(u => u.email === data.email && u.id !== userId)) {
        return { success: false, message: "El correo electrónico ya está en uso por otro usuario." };
      }
    }
    
    const updatedUserData = { ...mockUsers[userIndex], ...data };
    
    if (data.department === "_NO_DEPARTMENT_") { 
        updatedUserData.department = undefined;
    } else if (data.department !== undefined) { 
        updatedUserData.department = data.department;
    }

    if (data.password && data.password.trim() !== "") {
      updatedUserData.password = data.password;
    } else {
      // If password field is empty, keep the existing password
      updatedUserData.password = mockUsers[userIndex].password; 
    }

    mockUsers[userIndex] = updatedUserData;

    // Construct details for audit log
    let details = `Usuario ID: ${userId}, Nombre: ${targetUserOriginal.name} (${targetUserOriginal.email}). Cambios: `;
    const changes = [];
    if (data.name && data.name !== targetUserOriginal.name) changes.push(`Nombre de '${targetUserOriginal.name}' a '${data.name}'`);
    if (data.email && data.email !== targetUserOriginal.email) changes.push(`Email de '${targetUserOriginal.email}' a '${data.email}'`);
    if (data.role && data.role !== targetUserOriginal.role) changes.push(`Rol de '${targetUserOriginal.role}' a '${data.role}'`);
    if (data.department !== targetUserOriginal.department) changes.push(`Departamento de '${targetUserOriginal.department || "N/A"}' a '${updatedUserData.department || "N/A"}'`); // Use updatedUserData here
    if (data.password && data.password.trim() !== "" && data.password !== targetUserOriginal.password) changes.push(`Contraseña actualizada.`);
    details += changes.join(', ') || "Sin cambios detectables en campos principales.";


    if (user.email) { // Ensure admin email exists before logging
        await logAuditEvent(user.email, "Actualización de Usuario por Administrador", details);
    }
    
    // If admin updates their own info through this, update context user
    if (user && user.id === userId) { 
      const updatedSelf = { ...user, ...mockUsers[userIndex] };
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
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const deletedUserName = mockUsers[userIndex].name;
      const deletedUserEmail = mockUsers[userIndex].email;
      mockUsers.splice(userIndex, 1);
      if (user.email) { // Ensure admin email exists before logging
        await logAuditEvent(user.email, "Eliminación de Usuario por Administrador", `Usuario: ${deletedUserName} (${deletedUserEmail}), ID: ${userId}`);
      }
      return { success: true, message: "Usuario eliminado exitosamente." };
    }
    return { success: false, message: "Usuario no encontrado." };
  };

  const getAllUsers = () => {
    return [...mockUsers]; 
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


"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export const mockUsers: User[] = [
  { id: "3", name: "Sistemas ClinicaIEQ", email: "sistemas@clinicaieq.com", role: "Admin", avatarUrl: "https://placehold.co/100x100.png?text=SC", department: "Gerencia", password: "adminpassword" },
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

  const login = async (email: string, pass: string): Promise<boolean> => { // pass parameter is kept for signature consistency, but not used
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = mockUsers.find(u => u.email === email); // In mock, we don't check password
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("ticketflow_user", JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
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
      password: pass, // Store password
    };
    mockUsers.push(newUser); 
    setUser(newUser);
    localStorage.setItem("ticketflow_user", JSON.stringify(newUser));
    setIsLoading(false);
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
        // alert("El correo electrónico ya está en uso por otro usuario."); // Using toast instead
        return false; // Indicate failure for toast handling in component
      }
      const updatedUser = { ...mockUsers[userIndex], name, email };
      mockUsers[userIndex] = updatedUser;
      setUser(updatedUser);
      localStorage.setItem("ticketflow_user", JSON.stringify(updatedUser));
      setIsLoading(false);
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
      setUser(updatedUser); // Update current user state
      localStorage.setItem("ticketflow_user", JSON.stringify(updatedUser)); // Update localStorage
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const updateUserByAdmin = async (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>): Promise<{ success: boolean; message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300)); 
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: "Usuario no encontrado." };
    }

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

    // If password is provided and not empty, update it. Otherwise, keep the old one.
    if (data.password && data.password.trim() !== "") {
      updatedUserData.password = data.password;
    } else {
      updatedUserData.password = mockUsers[userIndex].password; // Keep existing if not provided or empty
    }


    mockUsers[userIndex] = updatedUserData;

    if (user && user.id === userId) { 
      const updatedSelf = { ...user, ...mockUsers[userIndex] };
      setUser(updatedSelf);
      localStorage.setItem("ticketflow_user", JSON.stringify(updatedSelf));
    }
    return { success: true, message: "Usuario actualizado exitosamente." };
  };

  const deleteUserByAdmin = async (userId: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (user && user.id === userId) {
      return { success: false, message: "No puedes eliminar tu propia cuenta de administrador." };
    }
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
      return { success: true, message: "Usuario eliminado exitosamente." };
    }
    return { success: false, message: "Usuario no encontrado." };
  };

  const getAllUsers = () => {
    return [...mockUsers]; 
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, isLoading, login, logout, register, updateProfile, updateSelfPassword, getAllUsers, updateUserByAdmin, deleteUserByAdmin }}>
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

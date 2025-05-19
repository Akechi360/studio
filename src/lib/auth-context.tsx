
"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Mock users - in a real app, this would come from a database
// This list is now also used for the User Management page.
export const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@example.com", role: "Admin", avatarUrl: "https://placehold.co/100x100.png?text=AU", department: "Administracion" },
  { id: "2", name: "Regular User", email: "user@example.com", role: "User", avatarUrl: "https://placehold.co/100x100.png?text=RU", department: "Laboratorio" },
  { id: "3", name: "Sistemas ClinicaIEQ", email: "sistemas@clinicaieq.com", role: "Admin", avatarUrl: "https://placehold.co/100x100.png?text=SC", department: "Gerencia" },
  { id: '4', name: 'Alice Wonderland', email: 'alice@example.com', role: 'User', avatarUrl: 'https://placehold.co/40x40.png?text=AW', department: "Radiologia" },
  { id: '5', name: 'Bob The Builder', email: 'bob@example.com', role: 'User', avatarUrl: 'https://placehold.co/40x40.png?text=BB' }, // No department initially
];

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>; 
  logout: () => void;
  register: (name: string, email: string, pass: string) => Promise<boolean>; 
  updateProfile: (name: string, email: string) => Promise<boolean>;
  getAllUsers: () => User[];
  updateUserByAdmin: (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department'>>) => Promise<{ success: boolean; message?: string }>;
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

  const login = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = mockUsers.find(u => u.email === email);
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

  const register = async (name: string, email: string): Promise<boolean> => {
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
      avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,2).toUpperCase()}`
      // department will be undefined by default
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
        alert("El correo electrónico ya está en uso por otro usuario.");
        return false;
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

  const updateUserByAdmin = async (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department'>>): Promise<{ success: boolean; message?: string }> => {
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
    // If "Sin Departamento" was chosen (represented by an empty string from the form), store it as undefined.
    if (data.department === "") {
        updatedUserData.department = undefined;
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
    <AuthContext.Provider value={{ user, role: user?.role || null, isLoading, login, logout, register, updateProfile, getAllUsers, updateUserByAdmin, deleteUserByAdmin }}>
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

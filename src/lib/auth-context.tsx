
"use client";

import type { User, Role } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logAuditEvent } from "@/lib/actions";
import { prisma } from "@/lib/db"; // Import Prisma client
import bcrypt from 'bcrypt'; // For password comparison

// Placeholder for specific approver emails, this might be managed differently (e.g. roles/permissions table)
// For now, this array is still used for UI logic related to who can submit approvals vs. only approve.
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
        // In a real app with server-side sessions, you'd make an API call here
        // For this client-side context, we'll rely on localStorage initially,
        // but this is NOT secure for production.
        const storedUserJson = localStorage.getItem("ticketflow_user");
        if (storedUserJson) {
          const parsedUserFromStorage = JSON.parse(storedUserJson) as User;
          // TODO: Validate this user against the database if they exist in localStorage
          // For now, if they were logged in and are in localStorage, we set them.
          // A better approach would be a session check API endpoint.
          if (parsedUserFromStorage && parsedUserFromStorage.id) {
             const dbUser = await prisma.user.findUnique({ where: { id: parsedUserFromStorage.id }});
             if (dbUser) {
                const { password, ...userWithoutPassword } = dbUser;
                setUser(userWithoutPassword);
             } else {
                localStorage.removeItem("ticketflow_user"); // User not found in DB, clear local
             }
          }
        }
      } catch (error) {
        console.error("Error checking user session:", error);
        localStorage.removeItem("ticketflow_user");
      }
      setIsLoading(false);
    };
    checkUserSession();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) {
        const passwordMatch = await bcrypt.compare(pass, dbUser.password);
        if (passwordMatch) {
          const { password, ...userToStore } = dbUser;
          setUser(userToStore);
          localStorage.setItem("ticketflow_user", JSON.stringify(userToStore));
          await logAuditEvent(email, "Inicio de Sesión Exitoso");
          setIsLoading(false);
          return true;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    }
    await logAuditEvent(email, "Intento de Inicio de Sesión Fallido");
    setIsLoading(false);
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
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        setIsLoading(false);
        return false; // User already exists
      }
      const hashedPassword = await bcrypt.hash(pass, 10);
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "User", // Default role
        },
      });
      const { password, ...userToStore } = newUser;
      setUser(userToStore);
      localStorage.setItem("ticketflow_user", JSON.stringify(userToStore));
      await logAuditEvent(email, "Registro de Nuevo Usuario");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    try {
      // Check if new email is taken by another user
      if (email !== user.email) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== user.id) {
          setIsLoading(false);
          return false; // Email already in use
        }
      }
      const updatedDbUser = await prisma.user.update({
        where: { id: user.id },
        data: { name, email },
      });
      const { password, ...userToStore } = updatedDbUser;
      setUser(userToStore);
      localStorage.setItem("ticketflow_user", JSON.stringify(userToStore));
      await logAuditEvent(user.email, "Actualización de Perfil");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const updateSelfPassword = async (newPasswordValue: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const hashedPassword = await bcrypt.hash(newPasswordValue, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      await logAuditEvent(user.email, "Actualización de Contraseña Propia");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Self password update error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const resetPasswordByEmail = async (email: string, newPasswordValue: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const targetUser = await prisma.user.findUnique({ where: { email } });
      if (!targetUser) {
        setIsLoading(false);
        return { success: false, message: "Usuario no encontrado con ese correo." };
      }
      const hashedPassword = await bcrypt.hash(newPasswordValue, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      await logAuditEvent(email, "Restablecimiento de Contraseña por Admin/Sistema");
      setIsLoading(false);
      return { success: true, message: "Contraseña restablecida exitosamente." };
    } catch (error) {
      console.error("Password reset error:", error);
      setIsLoading(false);
      return { success: false, message: "Error al restablecer la contraseña." };
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const dbUsers = await prisma.user.findMany({
        orderBy: { name: 'asc' }
      });
      return dbUsers.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  };

  const updateUserByAdmin = async (userId: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'department' | 'password'>>): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== "Admin") {
      return { success: false, message: "Acción no permitida." };
    }
    setIsLoading(true);
    try {
      const updateData: any = { ...data };
      if (data.password && data.password.trim() !== "") {
        updateData.password = await bcrypt.hash(data.password, 10);
      } else {
        delete updateData.password; // Don't update password if field is empty
      }

      if (data.email) {
         const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
         if (existingUser && existingUser.id !== userId) {
           setIsLoading(false);
           return { success: false, message: "El correo electrónico ya está en uso por otro usuario." };
         }
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      await logAuditEvent(user.email, "Actualización de Usuario por Admin", `Usuario ID: ${userId}, Nuevos Datos: ${JSON.stringify(data)}`);
      setIsLoading(false);
      return { success: true, message: "Usuario actualizado." };
    } catch (error) {
      console.error("Admin update user error:", error);
      setIsLoading(false);
      return { success: false, message: "Error al actualizar usuario." };
    }
  };

  const deleteUserByAdmin = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== "Admin") {
      return { success: false, message: "Acción no permitida." };
    }
    if (user.id === userId) {
      return { success: false, message: "No puedes eliminar tu propia cuenta de administrador."}
    }
    setIsLoading(true);
    try {
      // Consider what to do with related records (e.g., tickets, comments).
      // Prisma's default onDelete behavior (Cascade, SetNull) in schema.prisma handles this.
      // Here, we might need to handle related records manually if cascade is not set or if specific logic is needed.
      // For simplicity, we'll rely on schema-defined cascade or restrict for now.
      // Example: Manually disassociate or delete related records first if cascade isn't set up for all relations.
      // await prisma.ticket.updateMany({ where: { userId: userId }, data: { userId: null } }); // if userId is nullable
      await prisma.user.delete({ where: { id: userId } });
      await logAuditEvent(user.email, "Eliminación de Usuario por Admin", `Usuario ID: ${userId}`);
      setIsLoading(false);
      return { success: true, message: "Usuario eliminado." };
    } catch (error: any) {
      console.error("Admin delete user error:", error);
      setIsLoading(false);
       if (error.code === 'P2003') { // Foreign key constraint failed
        return { success: false, message: "No se puede eliminar el usuario porque tiene registros asociados (tickets, comentarios, etc.). Reasigna o elimina esos registros primero." };
      }
      return { success: false, message: "Error al eliminar usuario." };
    }
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

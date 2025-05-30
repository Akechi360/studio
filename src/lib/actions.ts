
"use server";

import { z } from "zod";
import { prisma } from "./db";
import bcrypt from 'bcryptjs';

// Keep User from types.ts for client-side compatibility
import type { AttachmentClientData, ExcelInventoryItemData, User as UserType } from "./types";
import type {
  Role as PrismaRole, // aliased
  TicketPriority as PrismaTicketPriority, // aliased
  TicketStatus as PrismaTicketStatus, // aliased
  ApprovalRequestType as PrismaApprovalRequestType, // aliased
  ApprovalStatus as PrismaApprovalStatus, // aliased
  PaymentType as PrismaPaymentType, // aliased
  InventoryItemCategory as PrismaInventoryItemCategory, // aliased
  InventoryItemStatus as PrismaInventoryItemStatus, // aliased
  StorageType as PrismaStorageType, // aliased
  RamOption as PrismaRamOption, // aliased
  CasoMantenimientoStatus as PrismaCasoMantenimientoStatus, // aliased
  CasoMantenimientoPriority as PrismaCasoMantenimientoPriority // aliased
} from "@prisma/client";

import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";
import {
  INVENTORY_ITEM_CATEGORIES,
  INVENTORY_ITEM_STATUSES,
  RAM_OPTIONS,
  STORAGE_TYPES_ZOD_ENUM,
  CASO_STATUSES,
  CASO_PRIORITIES,
  TicketPriority, // Client-side string type
  TicketStatus,   // Client-side string type
  InventoryItemCategory, // Client-side string type
  InventoryItemStatus,   // Client-side string type
  RamOption as ClientRamOption, // Client-side string type for RAM
  StorageType as ClientStorageType, // Client-side string type for Storage
  CasoMantenimientoStatus, // Client-side string type
  CasoMantenimientoPriority, // Client-side string type
  PaymentType as ClientPaymentType, // Client-side string type
  ApprovalRequestType as ClientApprovalRequestType // Client-side string type
} from "./types"; // Keep these string types for client-side forms


import {
  BaseInventoryItemSchema,
  CreateApprovalRequestActionSchema,
  ApprovePagoProveedorContadoSchema,
  ApprovePagoProveedorCuotasSchema,
  ApproveCompraSchema,
  RejectOrInfoActionSchema,
  CreateCasoMantenimientoFormSchema,
  UpdateCasoMantenimientoFormSchema,
  PurchaseRequestDataSchema,
  PaymentRequestDataSchema,
  AttachmentDataSchema,
  ApproveActionBaseSchema,
  PaymentInstallmentActionSchema,
} from "./schemas";
import { sendNtfyNotification } from "./ntfy";
import { revalidatePath } from "next/cache";


// --- Audit Log Actions ---
export async function logAuditEvent(performingUserEmail: string, actionDescription: string, details?: string): Promise<void> {
  try {
    await prisma.auditLogEntry.create({
      data: {
        userEmail: performingUserEmail,
        action: actionDescription,
        details: details || undefined,
      }
    });
    revalidatePath("/admin/audit");
  } catch (error) {
    console.error("logAuditEvent Error:", error);
    // Depending on requirements, you might want to throw the error or handle it silently
  }
}

export async function getAuditLogs(): Promise<import('@prisma/client').AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLogEntry.findMany({
      orderBy: { timestamp: 'desc' },
    });
    return logs;
  } catch (error) {
    console.error("getAuditLogs Error:", error);
    return [];
  }
}

// --- Authentication Server Actions (called by AuthContext) ---

export async function loginUserServerAction(email: string, pass: string): Promise<{ success: boolean; user: Omit<import('@prisma/client').User, 'password'> | null; message?: string }> {
  try {
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (dbUser && dbUser.password) {
      const passwordMatch = await bcrypt.compare(pass, dbUser.password);
      if (passwordMatch) {
        const { password, ...userToReturn } = dbUser;
        await logAuditEvent(email, "Inicio de Sesión Exitoso");
        return { success: true, user: userToReturn, message: "Inicio de sesión exitoso." };
      }
    }
    await logAuditEvent(email, "Intento de Inicio de Sesión Fallido", `Intento con email: ${email}`);
    return { success: false, user: null, message: "Correo electrónico o contraseña no válidos." };
  } catch (error) {
    console.error("loginUserServerAction Error:", error);
    await logAuditEvent(email, "Error en Inicio de Sesión", `Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, user: null, message: "Error del servidor durante el inicio de sesión." };
  }
}

export async function registerUserServerAction(name: string, email: string, pass: string): Promise<{ success: boolean; user: Omit<import('@prisma/client').User, 'password'> | null; message?: string }> {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, user: null, message: "Este correo electrónico ya está en uso." };
    }
    const hashedPassword = await bcrypt.hash(pass, 10);
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "User", // Default role
        avatarUrl: `https://placehold.co/100x100.png?text=${initials}`,
      },
    });
    const { password, ...userToReturn } = newUser;
    await logAuditEvent(email, "Registro de Nuevo Usuario", `Usuario: ${name} (${email})`);
    return { success: true, user: userToReturn, message: "Registro exitoso." };
  } catch (error) {
    console.error("registerUserServerAction Error:", error);
    await logAuditEvent(email, "Error en Registro de Usuario", `Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, user: null, message: "Error del servidor durante el registro." };
  }
}

export async function getUserByIdServerAction(userId: string): Promise<Omit<import('@prisma/client').User, 'password'> | null> {
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (dbUser) {
      const { password, ...userToReturn } = dbUser;
      return userToReturn;
    }
    return null;
  } catch (error) {
    console.error("getUserByIdServerAction Error:", error);
    return null;
  }
}

export async function updateUserProfileServerAction(userId: string, name: string, email: string): Promise<{ success: boolean; user: Omit<import('@prisma/client').User, 'password'> | null; message?: string }> {
  try {
    const currentUserData = await prisma.user.findUnique({ where: { id: userId }});
    if (!currentUserData) {
        return { success: false, user: null, message: "Usuario no encontrado." };
    }

    if (email && email !== currentUserData.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return { success: false, user: null, message: "El correo electrónico ya está en uso por otro usuario." };
      }
    }
    const updatedDbUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    });
    const { password, ...userToReturn } = updatedDbUser;
    await logAuditEvent(email, "Actualización de Perfil", `Usuario ID: ${userId}`);
    revalidatePath("/profile");
    revalidatePath("/admin/users");
    return { success: true, user: userToReturn, message: "Perfil actualizado." };
  } catch (error) {
    console.error("updateUserProfileServerAction Error:", error);
    await logAuditEvent(email, "Error en Actualización de Perfil", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, user: null, message: "Error del servidor al actualizar el perfil." };
  }
}

export async function updateUserPasswordServerAction(userId: string, newPasswordValue: string): Promise<{ success: boolean; message: string }> {
  try {
    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToUpdate || !userToUpdate.email) {
        return { success: false, message: "Usuario no encontrado o email no disponible." };
    }
    const hashedPassword = await bcrypt.hash(newPasswordValue, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    await logAuditEvent(userToUpdate.email, "Actualización de Contraseña Propia", `Usuario ID: ${userId}`);
    return { success: true, message: "Contraseña actualizada exitosamente." };
  } catch (error) {
    console.error("updateUserPasswordServerAction Error:", error);
    const userEmail = (await prisma.user.findUnique({where: {id: userId}}))?.email || 'unknown_user_for_password_update';
    await logAuditEvent(userEmail, "Error en Actualización de Contraseña Propia", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error del servidor al actualizar la contraseña." };
  }
}

export async function resetUserPasswordByEmailServerAction(email: string, newPasswordValue: string): Promise<{ success: boolean; message: string }> {
  try {
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return { success: false, message: "Usuario no encontrado con ese correo." };
    }
    const hashedPassword = await bcrypt.hash(newPasswordValue, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    await logAuditEvent(email, "Restablecimiento de Contraseña por Olvido", `Usuario: ${email}`);
    return { success: true, message: "Contraseña restablecida exitosamente." };
  } catch (error) {
    console.error("resetUserPasswordByEmailServerAction Error:", error);
    await logAuditEvent(email, "Error en Restablecimiento de Contraseña", `Usuario: ${email}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error del servidor al restablecer la contraseña." };
  }
}

export async function getAllUsersServerAction(): Promise<Omit<import('@prisma/client').User, 'password'>[]> {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    return dbUsers.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  } catch (error) {
    console.error("getAllUsersServerAction Error:", error);
    return [];
  }
}

export async function updateUserByAdminServerAction(
  adminEmail: string,
  userId: string,
  data: Partial<Pick<UserType, 'name' | 'role' | 'email' | 'department' | 'password'>>
): Promise<{ success: boolean; message?: string }> {
  try {
    const updateData: any = {
      name: data.name,
      role: data.role as PrismaRole,
      email: data.email,
      department: data.department || null,
    };
    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.email) {
        const userBeingEdited = await prisma.user.findUnique({ where: { id: userId } });
        if (userBeingEdited && data.email !== userBeingEdited.email) {
            const existingUserWithEmail = await prisma.user.findUnique({ where: { email: data.email } });
            if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
                return { success: false, message: "El correo electrónico ya está en uso por otro usuario." };
            }
        }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    await logAuditEvent(adminEmail, "Actualización de Usuario por Admin", `Usuario ID: ${userId}, Nuevos Datos: ${JSON.stringify({name:data.name, email: data.email, role: data.role, department: data.department})}`);
    revalidatePath("/admin/users");
    return { success: true, message: "Usuario actualizado." };
  } catch (error) {
    console.error("updateUserByAdminServerAction Error:", error);
    await logAuditEvent(adminEmail, "Error en Actualización de Usuario por Admin", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error del servidor al actualizar usuario." };
  }
}

export async function deleteUserByAdminServerAction(adminEmail: string, userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const userToDelete = await prisma.user.findUnique({ where: { id: userId }});
    if (!userToDelete) {
        return { success: false, message: "Usuario no encontrado para eliminar." };
    }
    if (userToDelete.email === adminEmail) {
        return { success: false, message: "Un administrador no puede eliminar su propia cuenta."}
    }

    // Check for related records before deleting (example for tickets, extend as needed)
    const relatedTickets = await prisma.ticket.count({ where: { userId } });
    if (relatedTickets > 0) {
      return { success: false, message: "No se puede eliminar el usuario porque tiene tickets asociados. Reasigna o elimina esos tickets primero." };
    }
    // TODO: Add similar checks for comments, approvals, inventory items, etc.

    await prisma.user.delete({ where: { id: userId } });
    await logAuditEvent(adminEmail, "Eliminación de Usuario por Admin", `Usuario ID: ${userId}, Email: ${userToDelete.email}`);
    revalidatePath("/admin/users");
    return { success: true, message: "Usuario eliminado." };
  } catch (error: any) {
    console.error("deleteUserByAdminServerAction Error:", error);
    await logAuditEvent(adminEmail, "Error en Eliminación de Usuario por Admin", `Usuario ID: ${userId}, Error: ${error.message || String(error)}`);
    if (error.code === 'P2003' || error.code === 'P2014' ) { // Prisma foreign key constraint violation
      return { success: false, message: "No se puede eliminar el usuario porque tiene registros asociados (tickets, comentarios, etc.). Reasigna o elimina esos registros primero." };
    }
    return { success: false, message: "Error del servidor al eliminar usuario." };
  }
}


// --- Ticket Actions ---
const CreateTicketClientSchema = z.object({
  subject: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]),
  userEmail: z.string().email(), // userEmail added here
});

const AddCommentClientSchema = z.object({
  text: z.string().min(1).max(1000),
});

const UpdateTicketStatusClientSchema = z.object({
  status: z.enum(TICKET_STATUSES_ENGLISH as [TicketStatus, ...TicketStatus[]]),
  actingUserEmail: z.string().email(),
});


export async function createTicketAction(
  userId: string,
  userName: string,
  values: z.infer<typeof CreateTicketClientSchema>
): Promise<{ success: boolean; message: string; ticketId?: string; errors?: any }> {
  const validatedFields = CreateTicketClientSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("createTicketAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al crear ticket debido a errores de validación.",
    };
  }
  const { subject, description, priority, userEmail } = validatedFields.data;

  try {
    const newTicket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority: priority as PrismaTicketPriority,
        status: "Open" as PrismaTicketStatus,
        userId,
        userName,
        userEmail,
      }
    });

    await logAuditEvent(userEmail, "Creación de Ticket", `Ticket Asunto: ${subject}, ID: ${newTicket.id}`);
    await sendNtfyNotification({
      title: `Nuevo Ticket: ${subject.substring(0, 30)}...`,
      message: `Ticket #${newTicket.id} (${subject}) creado por ${userName}. Prioridad: ${priority}.`,
      priority: priority === 'High' ? 5 : (priority === 'Medium' ? 3 : 1),
      tags: ['ticket', 'nuevo', priority.toLowerCase()],
    });

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${newTicket.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: "¡Ticket creado exitosamente!",
      ticketId: newTicket.id,
    };
  } catch (error) {
    console.error("createTicketAction Error:", error);
    await logAuditEvent(userEmail, "Error en Creación de Ticket", `Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      message: "Error de base de datos al crear el ticket.",
    };
  }
}

export async function addCommentAction(
  ticketId: string,
  commenter: Pick<UserType, 'id' | 'name' | 'email' | 'avatarUrl'>,
  values: z.infer<typeof AddCommentClientSchema>
): Promise<{ success: boolean; message: string; commentId?: string, errors?: any }> {
  const validatedFields = AddCommentClientSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("addCommentAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al añadir comentario debido a errores de validación.",
    };
  }

  if (!commenter.id || !commenter.email || !commenter.name) {
    console.error("addCommentAction: Commenter info incomplete", commenter);
    return { success: false, message: "Información del comentador incompleta." };
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        text: validatedFields.data.text,
        ticketId,
        userId: commenter.id,
        userName: commenter.name,
        userAvatarUrl: commenter.avatarUrl || null,
      }
    });
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    await logAuditEvent(commenter.email, "Adición de Comentario", `Ticket ID: ${ticketId}, Usuario: ${commenter.name}`);
    await sendNtfyNotification({
      title: `Nuevo Comentario en Ticket #${ticketId}`,
      message: `${commenter.name} comentó: "${validatedFields.data.text.substring(0,50)}..."`,
      tags: ['ticket', 'comentario', ticketId],
    });

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "¡Comentario añadido exitosamente!",
      commentId: newComment.id,
    };
  } catch (error) {
    console.error("addCommentAction Error:", error);
    await logAuditEvent(commenter.email, "Error en Adición de Comentario", `Ticket ID: ${ticketId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      message: "Error de base de datos al añadir comentario.",
    };
  }
}

export async function updateTicketStatusAction(
  ticketId: string,
  values: z.infer<typeof UpdateTicketStatusClientSchema>
): Promise<{ success: boolean; message: string; errors?: any }> {
  const validatedFields = UpdateTicketStatusClientSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("updateTicketStatusAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al actualizar estado debido a errores de validación.",
    };
  }
  const { status, actingUserEmail } = validatedFields.data;

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      console.error(`updateTicketStatusAction: Ticket with ID ${ticketId} not found.`);
      return { success: false, message: "Ticket no encontrado." };
    }
    const oldStatus = ticket.status;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status as PrismaTicketStatus, updatedAt: new Date() }
    });

    await logAuditEvent(actingUserEmail, "Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, De: ${oldStatus}, A: ${status}`);
    await sendNtfyNotification({
      title: `Ticket #${ticketId} Actualizado`,
      message: `El estado del ticket "${ticket.subject}" cambió de ${oldStatus} a ${status}.`,
      tags: ['ticket', 'actualizacion-estado', ticketId, status.toLowerCase().replace(' ', '-')],
    });

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
    revalidatePath("/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/reports");

    const statusDisplayMap: Record<string, string> = TICKET_STATUSES_ENGLISH.reduce((acc, s) => {
        acc[s] = s;
        return acc;
    }, {} as Record<string, string>);


    return { success: true, message: `Estado del ticket actualizado a ${statusDisplayMap[status] || status}.` };
  } catch (error) {
    console.error("updateTicketStatusAction Error:", error);
    await logAuditEvent(actingUserEmail, "Error en Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error de base de datos al actualizar estado." };
  }
}

export async function getTicketById(ticketId: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        comments: { orderBy: { createdAt: 'asc' }},
        attachments: true,
        user: { select: { name: true, email: true }}
      }
    });
    return ticket;
  } catch (error) {
    console.error(`getTicketById Error for ticket ID ${ticketId}:`, error);
    return null;
  }
}

export async function getAllTickets() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        user: { select: { name: true }},
        comments: { select: { id: true } },
        attachments: { select: { id: true, fileName: true, url: true, size: true }}
      },
      orderBy: [
        { priority: 'desc'}, // High, Medium, Low in Prisma enum order
        { createdAt: 'desc'}
      ]
    });
    return tickets;
  } catch (error) {
    console.error("getAllTickets Error:", error);
    return [];
  }
}

export async function getDashboardStats() {
  try {
    const total = await prisma.ticket.count();
    const open = await prisma.ticket.count({ where: { status: "Open" } });
    const inProgress = await prisma.ticket.count({ where: { status: "InProgress" } });
    const resolved = await prisma.ticket.count({ where: { status: "Resolved" } });
    const closed = await prisma.ticket.count({ where: { status: "Closed" } });

    const summary = { total, open, inProgress, resolved, closed };

    const byPriorityDb = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true },
    });
    const byStatusDb = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const priorityMap = TICKET_PRIORITIES_ENGLISH.reduce((acc, p) => { acc[p] = 0; return acc; }, {} as Record<TicketPriority, number>);
    byPriorityDb.forEach(p => { priorityMap[p.priority as TicketPriority] = p._count.id; });

    const statusMap = TICKET_STATUSES_ENGLISH.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as Record<TicketStatus, number>);
    byStatusDb.forEach(s => { statusMap[s.status as TicketStatus] = s._count.id; });

    const stats = {
      byPriority: TICKET_PRIORITIES_ENGLISH.map(pKey => ({
        name: pKey as string,
        value: priorityMap[pKey],
      })),
      byStatus: TICKET_STATUSES_ENGLISH.map(sKey => ({
        name: sKey as string,
        value: statusMap[sKey],
      })),
    };
    return { summary, stats };
  } catch (error) {
    console.error("getDashboardStats Error:", error);
    const placeholderSummary = { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
    const placeholderStats = {
      byPriority: TICKET_PRIORITIES_ENGLISH.map(pKey => ({ name: pKey as string, value: 0 })),
      byStatus: TICKET_STATUSES_ENGLISH.map(sKey => ({ name: sKey as string, value: 0 }))
    };
    return { summary: placeholderSummary, stats: placeholderStats };
  }
}

// --- Inventory Actions ---

const ramStringToPrismaEnumMap: Record<string, PrismaRamOption> = {
  "No Especificado": PrismaRamOption.NoEspecificado,
  "2GB": PrismaRamOption.RAM_2GB,
  "4GB": PrismaRamOption.RAM_4GB,
  "8GB": PrismaRamOption.RAM_8GB,
  "12GB": PrismaRamOption.RAM_12GB,
  "16GB": PrismaRamOption.RAM_16GB,
  "32GB": PrismaRamOption.RAM_32GB,
  "64GB": PrismaRamOption.RAM_64GB,
  "Otro": PrismaRamOption.Otro,
};

const storageTypeStringToPrismaEnumMap: Record<string, PrismaStorageType> = {
  "HDD": PrismaStorageType.HDD,
  "SSD": PrismaStorageType.SSD,
  "No Especificado": PrismaStorageType.NoEspecificado,
};

const categoryStringToPrismaEnumMap: Record<string, PrismaInventoryItemCategory> = INVENTORY_ITEM_CATEGORIES.reduce((acc, category) => {
  acc[category] = category as PrismaInventoryItemCategory; // Prisma enums match TypeScript string literal types here
  return acc;
}, {} as Record<string, PrismaInventoryItemCategory>);

const statusStringToPrismaEnumMap: Record<string, PrismaInventoryItemStatus> = INVENTORY_ITEM_STATUSES.reduce((acc, status) => {
  acc[status] = status as PrismaInventoryItemStatus; // Prisma enums match TypeScript string literal types here
  return acc;
}, {} as Record<string, PrismaInventoryItemStatus>);


export async function getAllInventoryItems() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { addedByUser: { select: { name: true }}}
    });
    return items;
  } catch (error) {
    console.error("getAllInventoryItems Error:", error);
    return [];
  }
}

export async function addInventoryItemAction(
  currentUser: Pick<UserType, 'id' | 'name' | 'email'>,
  values: z.infer<typeof BaseInventoryItemSchema>
): Promise<{ success: boolean; message: string; itemId?: string, errors?: any }> {
  try {
    if (!currentUser || !currentUser.id || !currentUser.name || !currentUser.email) {
      console.error("addInventoryItemAction: currentUser is invalid", currentUser);
      return { success: false, message: "Información del usuario actual incompleta o inválida." };
    }
    const validatedFields = BaseInventoryItemSchema.safeParse(values);
    if (!validatedFields.success) {
      console.error("addInventoryItemAction: Validation failed", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Fallo al añadir artículo debido a errores de validación.",
      };
    }
    const data = validatedFields.data;

    const dataToCreate = {
      name: data.name,
      category: categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory],
      brand: data.brand || null,
      model: data.model || null,
      serialNumber: data.serialNumber || null,
      processor: data.processor || null,
      ram: (data.ram && data.ram !== "No Especificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOption] : PrismaRamOption.NoEspecificado) || null,
      storageType: (data.storageType && data.storageType !== "No Especificado" ? storageTypeStringToPrismaEnumMap[data.storageType as ClientStorageType] : PrismaStorageType.NoEspecificado) || null,
      storage: data.storage || null,
      quantity: data.quantity,
      location: data.location || null,
      status: statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus],
      notes: data.notes || null,
      addedByUserId: currentUser.id,
      addedByUserName: currentUser.name,
    };

    const newItem = await prisma.inventoryItem.create({
      data: dataToCreate,
    });

    await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo Nombre: ${data.name}, ID: ${newItem.id}`);
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${data.name}" añadido exitosamente.`, itemId: newItem.id };
  } catch (error: any) {
    console.error("addInventoryItemAction Error:", error);
    const userEmail = currentUser?.email || 'unknown_user_for_add_item';
    await logAuditEvent(userEmail, "Error en Adición de Artículo de Inventario", `Error: ${error.message || String(error)}`);
    if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
      return { success: false, message: "Error: El número de serie ya existe en el inventario." };
    }
    return { success: false, message: `Error de base de datos al añadir artículo: ${error.message || "Error desconocido"}` };
  }
}

export async function updateInventoryItemAction(
  itemId: string,
  actingUserEmail: string,
  values: z.infer<typeof BaseInventoryItemSchema>
): Promise<{ success: boolean; message: string; itemId?: string, errors?: any }> {
  try {
    const validatedFields = BaseInventoryItemSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al actualizar artículo debido a errores de validación." };
    }
    const data = validatedFields.data;

    const itemToUpdate = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!itemToUpdate) return { success: false, message: "Artículo no encontrado." };

    const dataToUpdate = {
        name: data.name,
        category: categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory],
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        processor: data.processor || null,
        ram: (data.ram && data.ram !== "No Especificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOption] : PrismaRamOption.NoEspecificado) || null,
        storageType: (data.storageType && data.storageType !== "No Especificado" ? storageTypeStringToPrismaEnumMap[data.storageType as ClientStorageType] : PrismaStorageType.NoEspecificado) || null,
        storage: data.storage || null,
        quantity: data.quantity,
        location: data.location || null,
        status: statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus],
        notes: data.notes || null,
        updatedAt: new Date()
      };

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: dataToUpdate
    });

    await logAuditEvent(actingUserEmail, "Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${data.name}`);
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${data.name}" actualizado exitosamente.`, itemId: updatedItem.id };
  } catch (error: any) {
    console.error("updateInventoryItemAction Error:", error);
    await logAuditEvent(actingUserEmail, "Error en Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Error: ${error.message || String(error)}`);
     if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
      return { success: false, message: "Error: El número de serie ya existe en el inventario para otro artículo." };
    }
    return { success: false, message: `Error de base de datos al actualizar artículo: ${error.message || "Error desconocido"}` };
  }
}

export async function deleteInventoryItemAction(itemId: string, actingUserEmail: string): Promise<{ success: boolean; message: string }> {
  try {
    const itemToDelete = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!itemToDelete) return { success: false, message: "Artículo no encontrado para eliminar." };

    await prisma.inventoryItem.delete({ where: { id: itemId } });

    await logAuditEvent(actingUserEmail, "Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${itemToDelete.name}`);
    revalidatePath("/inventory");
    return { success: true, message: "Artículo eliminado exitosamente." };
  } catch (error) {
    console.error("deleteInventoryItemAction Error:", error);
    await logAuditEvent(actingUserEmail, "Error en Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error de base de datos al eliminar artículo." };
  }
}

const excelToInternalFieldMap: Record<string, keyof z.infer<typeof BaseInventoryItemSchema>> = {
  'nombre': 'name', 'nombre del articulo': 'name', 'nombre del artículo': 'name', 'articulo': 'name', 'artículo': 'name', 'equipo': 'name',
  'categoría': 'category', 'categoria': 'category',
  'marca': 'brand',
  'modelo': 'model',
  'número de serie': 'serialNumber', 'numero de serie': 'serialNumber', 'n/s': 'serialNumber', 'serial': 'serialNumber', 'serie': 'serialNumber',
  'procesador': 'processor',
  'ram': 'ram', 'memoria ram': 'ram',
  'tipo de almacenamiento': 'storageType', 'tipo de disco': 'storageType',
  'capacidad de almacenamiento': 'storage', 'almacenamiento': 'storage',
  'cantidad': 'quantity', 'cant': 'quantity',
  'ubicación': 'location', 'ubicacion': 'location', 'departamento': 'location', 'asignacion': 'location', 'asignación': 'location',
  'estado': 'status',
  'notas adicionales': 'notes', 'notas': 'notes', 'observaciones': 'notes',
};

const mapExcelRowToInventoryItemFormValues = (row: ExcelInventoryItemData): Partial<z.infer<typeof BaseInventoryItemSchema>> => {
  const mapped: Partial<z.infer<typeof BaseInventoryItemSchema>> = {};
  for (const excelHeader in row) {
    const lowerExcelHeader = excelHeader.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const internalField = excelToInternalFieldMap[lowerExcelHeader] as keyof z.infer<typeof BaseInventoryItemSchema>;
    if (internalField) {
      let value: any = row[excelHeader];
      if (value === null || value === undefined || String(value).trim() === "") {
        mapped[internalField] = undefined;
        continue;
      }

      if (internalField === 'quantity') {
        const parsedQuantity = parseInt(String(value), 10);
        mapped[internalField] = isNaN(parsedQuantity) ? undefined : parsedQuantity;
      } else if (internalField === 'category') {
        const normalizedValue = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        const foundValue = INVENTORY_ITEM_CATEGORIES.find(opt => opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "") === normalizedValue);
        mapped[internalField] = foundValue || undefined;
      } else if (internalField === 'status') {
         const normalizedValue = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
         const foundValue = INVENTORY_ITEM_STATUSES.find(opt => opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "") === normalizedValue);
        mapped[internalField] = foundValue || undefined;
      } else if (internalField === 'ram') {
        const normalizedValue = String(value).trim().toUpperCase().replace(/\s+/g,"").replace('GB','');
        const foundRamValue = RAM_OPTIONS.find(opt => opt.toUpperCase().replace(/\s+/g,"").replace('GB','') === normalizedValue);
        mapped[internalField] = foundRamValue || "No Especificado" as ClientRamOption;
      } else if (internalField === 'storageType') {
        const normalizedValue = String(value).trim().toUpperCase().replace(/\s+/g,"");
        const foundStorageType = STORAGE_TYPES_ZOD_ENUM.find(opt => opt.toUpperCase().replace(/\s+/g,"") === normalizedValue);
        mapped[internalField] = foundStorageType || "No Especificado" as ClientStorageType;
      }
      else {
         mapped[internalField] = String(value).trim();
      }
    }
  }
  if (mapped.quantity === undefined || isNaN(Number(mapped.quantity))) mapped.quantity = 1;
  if (mapped.status === undefined) mapped.status = "En Uso" as InventoryItemStatus;
  if (mapped.category === undefined) mapped.category = "Otro" as InventoryItemCategory;
  return mapped;
};

export async function importInventoryItemsAction(
  itemDataArray: ExcelInventoryItemData[],
  currentUserEmail: string,
  currentUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string; successCount: number; errorCount: number; errors: { row: number; message: string; data: ExcelInventoryItemData }[]; }> {
  let successCount = 0;
  let errorCount = 0;
  const errors: { row: number; message: string; data: ExcelInventoryItemData }[] = [];

  if (!itemDataArray || itemDataArray.length === 0) {
    return { success: false, message: "No se proporcionaron datos para importar o el archivo está vacío.", successCount: 0, errorCount: itemDataArray?.length || 0, errors: [{ row: 0, message: "Archivo vacío o sin datos.", data: {} }] };
  }

  try {
    for (let i = 0; i < itemDataArray.length; i++) {
      const rawRow = itemDataArray[i];
      let mappedData: Partial<z.infer<typeof BaseInventoryItemSchema>> = {};
      try {
        mappedData = mapExcelRowToInventoryItemFormValues(rawRow);
        const validatedFields = BaseInventoryItemSchema.safeParse(mappedData);

        if (!validatedFields.success) {
          errorCount++;
          const fieldErrors = validatedFields.error.flatten().fieldErrors as Record<string, string[] | undefined>;
          let errorMessage = Object.entries(fieldErrors)
            .map(([field, messages]) => `${field}: ${(messages || ['Error desconocido']).join(', ')}`)
            .join('; ') || "Error desconocido en validación.";
          errors.push({ row: i + 2, message: `Error de validación: ${errorMessage}`, data: rawRow });
          continue;
        }

        const data = validatedFields.data;
        const dataToCreate = {
            name: data.name,
            category: categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory],
            brand: data.brand || null,
            model: data.model || null,
            serialNumber: data.serialNumber || null,
            processor: data.processor || null,
            ram: (data.ram && data.ram !== "No Especificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOption] : PrismaRamOption.NoEspecificado) || null,
            storageType: (data.storageType && data.storageType !== "No Especificado" ? storageTypeStringToPrismaEnumMap[data.storageType as ClientStorageType] : PrismaStorageType.NoEspecificado) || null,
            storage: data.storage || null,
            quantity: data.quantity,
            location: data.location || null,
            status: statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus],
            notes: data.notes || null,
            addedByUserId: currentUserId,
            addedByUserName: currentUserName,
        };

        if (!dataToCreate.category) {
             errorCount++;
             errors.push({ row: i + 2, message: `Error de mapeo: Categoría inválida '${mappedData.category}' no encontrada en el sistema.`, data: rawRow });
             continue;
        }
        if (!dataToCreate.status) {
             errorCount++;
             errors.push({ row: i + 2, message: `Error de mapeo: Estado inválido '${mappedData.status}' no encontrado en el sistema.`, data: rawRow });
             continue;
        }
         if (dataToCreate.ram === undefined) {
            dataToCreate.ram = PrismaRamOption.NoEspecificado;
        }
        if (dataToCreate.storageType === undefined) {
            dataToCreate.storageType = PrismaStorageType.NoEspecificado;
        }

        await prisma.inventoryItem.create({ data: dataToCreate });
        successCount++;
      } catch (e: any) {
        errorCount++;
        if (e.code === 'P2002' && e.meta?.target?.includes('serialNumber')) {
             errors.push({ row: i + 2, message: `Error: Número de serie '${mappedData.serialNumber || 'N/A'}' ya existe.`, data: rawRow });
        } else {
            errors.push({ row: i + 2, message: `Error procesando fila: ${e.message || String(e)}`, data: rawRow });
        }
      }
    }

    if (successCount > 0) {
      await logAuditEvent(currentUserEmail, "Importación Masiva de Inventario", `Se importaron ${successCount} artículos. Errores: ${errorCount}.`);
    } else if (errorCount > 0 && itemDataArray.length > 0) {
      await logAuditEvent(currentUserEmail, "Intento Fallido de Importación Masiva de Inventario", `No se importaron artículos. Errores: ${errorCount} de ${itemDataArray.length} filas.`);
    }

    revalidatePath("/inventory");
    return {
      success: successCount > 0 && errorCount === 0,
      message: `Importación completada. ${successCount} artículos importados. ${errorCount > 0 ? `${errorCount} filas con errores.` : ''}`,
      successCount,
      errorCount,
      errors,
    };

  } catch (globalError: any) {
    console.error("Error global durante la importación de inventario:", globalError);
    await logAuditEvent(currentUserEmail, "Error Crítico en Importación Masiva de Inventario", globalError.message || "Error desconocido");
    return {
      success: false,
      message: `Error general durante la importación: ${globalError.message || "Error desconocido."}`,
      successCount,
      errorCount: itemDataArray.length - successCount,
      errors: itemDataArray.map((row, index) => ({ row: index + 2, message: "Error global durante la importación.", data: row})),
    };
  }
}


// --- Approval Actions ---
export async function createApprovalRequestAction(
  values: z.infer<typeof CreateApprovalRequestActionSchema>
): Promise<{ success: boolean; message: string; approvalId?: string; errors?: any }> {
  try {
    const validatedFields = CreateApprovalRequestActionSchema.safeParse(values);
    if (!validatedFields.success) {
      console.error("createApprovalRequestAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación." };
    }
    const data = validatedFields.data;

    const newApproval = await prisma.approvalRequest.create({
      data: {
        type: data.type as PrismaApprovalRequestType,
        subject: data.subject,
        description: data.description || null,
        status: "Pendiente" as PrismaApprovalStatus,
        requesterId: data.requesterId,
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail || null,
        ...(data.type === "Compra" && {
          itemDescription: data.itemDescription,
          estimatedPrice: data.estimatedPrice,
          supplierCompra: data.supplierCompra || null,
        }),
        ...(data.type === "PagoProveedor" && {
          supplierPago: data.supplierPago,
          totalAmountToPay: data.totalAmountToPay,
        }),
        activityLog: {
          create: [{
            action: "Solicitud Creada",
            userId: data.requesterId,
            userName: data.requesterName,
            comment: "Solicitud creada inicialmente.",
          }]
        },
        attachments: data.attachmentsData && data.attachmentsData.length > 0 ? {
          createMany: {
            data: data.attachmentsData.map(att => ({
              fileName: att.fileName,
              url: "uploads/placeholder/" + Date.now() + "_" + att.fileName.replace(/\s+/g, '_'), // Placeholder URL, ensure filename is safe
              size: att.size,
              type: att.type || 'application/octet-stream',
            }))
          }
        } : undefined,
      }
    });

    if (data.requesterEmail && newApproval) {
      await logAuditEvent(data.requesterEmail, `Creación de Solicitud de Aprobación (${data.type})`, `Asunto: ${data.subject}, ID: ${newApproval.id}`);
      await sendNtfyNotification({
        title: `Nueva Solicitud de Aprobación: ${data.type}`,
        message: `Solicitud "${data.subject}" por ${data.requesterName} (ID: ${newApproval.id}) está pendiente.`,
        tags: ['aprobacion', 'nueva', data.type.toLowerCase()],
      });
    }
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    if (newApproval) {
      revalidatePath(`/approvals/${newApproval.id}`);
    }

    return {
      success: true,
      message: `Solicitud de ${data.type === "Compra" ? "Compra" : "Pago a Proveedores"} enviada exitosamente.`,
      approvalId: newApproval?.id,
    };
  } catch (error) {
    console.error("createApprovalRequestAction Error:", error);
    const userEmail = values.requesterEmail || 'unknown_user_for_approval_creation';
    await logAuditEvent(userEmail, `Error en Creación de Solicitud de Aprobación (${values.type})`, `Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error de base de datos al crear solicitud de aprobación." };
  }
}


export async function getApprovalRequestsForUser(userId: string, userRole: PrismaRole) {
  try {
    if (userRole === "PresidenteIEQ") {
      return await prisma.approvalRequest.findMany({
        where: { status: { in: ["Pendiente", "InformacionSolicitada"] } },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await prisma.approvalRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("getApprovalRequestsForUser Error:", error);
    return [];
  }
}

export async function getApprovalRequestDetails(id: string) {
  try {
    return await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        attachments: true,
        activityLog: {
            include: { user: { select: { name: true }}},
            orderBy: { timestamp: 'desc' }
        },
        paymentInstallments: { orderBy: { dueDate: 'asc' }}
      }
    });
  } catch (error) {
    console.error(`getApprovalRequestDetails Error for ID ${id}:`, error);
    return null;
  }
}


export async function approveRequestAction(
  values: z.infer<typeof ApproveActionBaseSchema> & {
    approvedPaymentType?: ClientPaymentType;
    approvedAmount?: number;
    installments?: z.infer<typeof PaymentInstallmentActionSchema>[];
  }
): Promise<{ success: boolean; message: string }> {
  const { requestId, approverId, approverName, approverEmail, comment, approvedPaymentType, approvedAmount, installments } = values;

  try {
    if (!requestId || !approverId || !approverName || !approverEmail) {
      console.error("approveRequestAction: Approver info incomplete", values);
      return { success: false, message: "Información del aprobador incompleta."};
    }

    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      console.error(`approveRequestAction: Request with ID ${requestId} not found.`);
      return { success: false, message: "Solicitud no encontrada." };
    }
    if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      console.warn(`approveRequestAction: Request ${requestId} is not in a state that allows approval. Status: ${request.status}`);
      return { success: false, message: "La solicitud no está en un estado que permita aprobación." };
    }

    let validatedData: any;
    if (request.type === "PagoProveedor") {
        if (approvedPaymentType === "Contado") {
            validatedData = ApprovePagoProveedorContadoSchema.parse(values);
        } else if (approvedPaymentType === "Cuotas") {
            validatedData = ApprovePagoProveedorCuotasSchema.parse(values);
        } else {
            console.error(`approveRequestAction: Invalid payment type for PagoProveedor: ${approvedPaymentType}`);
            return { success: false, message: "Tipo de pago no válido para Pago a Proveedor." };
        }
    } else if (request.type === "Compra") {
        validatedData = ApproveCompraSchema.parse(values);
    } else {
        console.error(`approveRequestAction: Unknown request type: ${request.type}`);
        return { success: false, message: "Tipo de solicitud desconocida." };
    }

    await prisma.$transaction(async (tx) => {
        const updateData: any = {
            status: "Aprobado" as PrismaApprovalStatus,
            approverId,
            approverComment: validatedData.comment || null,
            approvedAt: new Date(),
            approverName: approverName,
            approverEmail: approverEmail,
        };

        if (request.type === "PagoProveedor") {
            updateData.approvedPaymentType = validatedData.approvedPaymentType as PrismaPaymentType;
            updateData.approvedAmount = validatedData.approvedAmount;

            await tx.paymentInstallment.deleteMany({ where: { approvalRequestId: requestId }});

            if (validatedData.approvedPaymentType === "Cuotas" && validatedData.installments && validatedData.installments.length > 0) {
                await tx.paymentInstallment.createMany({
                    data: validatedData.installments.map((inst: { amount: number; dueDate: Date; }) => ({
                        amount: inst.amount,
                        dueDate: new Date(inst.dueDate),
                        approvalRequestId: requestId,
                    }))
                });
            }
        }

        await tx.approvalRequest.update({ where: { id: requestId }, data: updateData });

        await tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: requestId,
                action: "Solicitud Aprobada",
                userId: approverId,
                userName: approverName,
                comment: validatedData.comment || "Aprobado sin comentarios adicionales.",
            }
        });
    });

    await sendNtfyNotification({
      title: `Solicitud Aprobada: #${requestId}`,
      message: `La solicitud "${request.subject}" ha sido APROBADA por ${approverName}.`,
      tags: ['aprobacion', 'aprobada', request.type.toLowerCase(), requestId],
    });

    await logAuditEvent(approverEmail, "Aprobación de Solicitud", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${validatedData.comment || 'N/A'}.`);
    revalidatePath(`/approvals/${requestId}`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true, message: "Solicitud aprobada exitosamente." };
  } catch (error: any) {
    console.error("approveRequestAction Error:", error);
    await logAuditEvent(approverEmail, "Error en Aprobación de Solicitud", `ID Solicitud: ${requestId}, Error: ${error.message || String(error)}`);
    if (error instanceof z.ZodError) {
        return { success: false, message: "Error de validación: " + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') };
    }
    return { success: false, message: `Error de base de datos al aprobar la solicitud: ${error.message || "Error desconocido"}` };
  }
}


export async function rejectRequestAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("rejectRequestAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      console.error(`rejectRequestAction: Request with ID ${requestId} not found.`);
      return { success: false, message: "Solicitud no encontrada." };
    }
     if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      console.warn(`rejectRequestAction: Request ${requestId} is not in a state that allows rejection. Status: ${request.status}`);
      return { success: false, message: "La solicitud no está en un estado que permita rechazo." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: "Rechazado" as PrismaApprovalStatus,
                approverId,
                approverComment: comment,
                rejectedAt: new Date(),
                approverName: approverName,
                approverEmail: approverEmail,
            }
        });

        await tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: requestId,
                action: "Solicitud Rechazada",
                userId: approverId,
                userName: approverName,
                comment: comment,
            }
        });
    });

    await sendNtfyNotification({
      title: `Solicitud Rechazada: #${requestId}`,
      message: `La solicitud "${request.subject}" ha sido RECHAZADA por ${approverName}. Motivo: ${comment}`,
      tags: ['aprobacion', 'rechazada', request.type.toLowerCase(), requestId],
      priority: 4,
    });

    await logAuditEvent(approverEmail, "Rechazo de Solicitud", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
    revalidatePath(`/approvals/${requestId}`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true, message: "Solicitud rechazada." };
  } catch (error) {
    console.error("rejectRequestAction Error:", error);
    await logAuditEvent(approverEmail, "Error en Rechazo de Solicitud", `ID Solicitud: ${requestId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error de base de datos al rechazar solicitud." };
  }
}

export async function requestMoreInfoAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("requestMoreInfoAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      console.error(`requestMoreInfoAction: Request with ID ${requestId} not found.`);
      return { success: false, message: "Solicitud no encontrada." };
    }
     if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
       console.warn(`requestMoreInfoAction: Request ${requestId} is not in a state that allows requesting more info. Status: ${request.status}`);
      return { success: false, message: "La solicitud no está en un estado que permita solicitar más información." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: "InformacionSolicitada" as PrismaApprovalStatus,
                infoRequestedAt: new Date(),
                approverId: request.approverId || approverId,
                approverName: request.approverName || approverName,
                approverEmail: request.approverEmail || approverEmail,
            }
        });

        await tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: requestId,
                action: "Información Adicional Solicitada",
                userId: approverId,
                userName: approverName,
                comment: comment,
            }
        });
    });

    await sendNtfyNotification({
      title: `Información Solicitada para #${requestId}`,
      message: `${approverName} solicitó más información para "${request.subject}": ${comment}`,
      tags: ['aprobacion', 'info-solicitada', request.type.toLowerCase(), requestId],
      priority: 4,
    });

    await logAuditEvent(approverEmail, "Solicitud de Más Información", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
    revalidatePath(`/approvals/${requestId}`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true, message: "Se solicitó más información." };
  } catch (error) {
    console.error("requestMoreInfoAction Error:", error);
    await logAuditEvent(approverEmail, "Error en Solicitud de Más Información", `ID Solicitud: ${requestId}, Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error de base de datos al solicitar más información." };
  }
}


// --- Gestión de Casos de Mantenimiento Actions ---
export async function createCasoMantenimientoAction(
  values: z.infer<typeof CreateCasoMantenimientoFormSchema>,
  currentUserId: string,
  currentUserName: string,
  currentUserEmail: string
): Promise<{ success: boolean; message: string; casoId?: string; errors?: any }> {
  try {
    const validatedFields = CreateCasoMantenimientoFormSchema.safeParse(values);
    if (!validatedFields.success) {
      console.error("createCasoMantenimientoAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación al crear el caso." };
    }
    const data = validatedFields.data;

    const newCaso = await prisma.casoDeMantenimiento.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        equipment: data.equipment || null,
        priority: data.priority as PrismaCasoMantenimientoPriority,
        assignedProviderName: data.assignedProviderName,
        currentStatus: "Registrado" as PrismaCasoMantenimientoStatus,
        registeredAt: new Date(),
        registeredByUserId: currentUserId,
        registeredByUserName: currentUserName,
        log: {
          create: [{
            action: "Caso Registrado",
            notes: "Caso de mantenimiento inicial registrado.",
            userId: currentUserId,
            userName: currentUserName,
            statusAfterAction: "Registrado" as PrismaCasoMantenimientoStatus
          }]
        }
      }
    });

    await logAuditEvent(currentUserEmail, "Registro de Nuevo Caso de Mantenimiento", `Título: ${data.title}, ID: ${newCaso.id}`);
    await sendNtfyNotification({
      title: `Nuevo Caso de Mantenimiento: ${data.title.substring(0,30)}...`,
      message: `Caso #${newCaso.id} (${data.title}) registrado por ${currentUserName}. Proveedor: ${data.assignedProviderName}.`,
      tags: ['mantenimiento', 'nuevo', data.priority.toLowerCase()],
      priority: data.priority === 'Critica' ? 5 : (data.priority === 'Alta' ? 4 : 3), // Assuming 'Critica' is the highest
    });

    revalidatePath("/mantenimiento");

    return {
      success: true,
      message: "Caso de mantenimiento registrado exitosamente.",
      casoId: newCaso.id,
    };
  } catch (error) {
    console.error("createCasoMantenimientoAction Error:", error);
    await logAuditEvent(currentUserEmail, "Error en Registro de Caso de Mantenimiento", `Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error de base de datos al crear caso de mantenimiento." };
  }
}

export async function getAllCasosMantenimientoAction() {
  try {
    return await prisma.casoDeMantenimiento.findMany({
      include: {
        registeredByUser: { select: { name: true }},
        log: { orderBy: { timestamp: 'desc' }}
      },
      orderBy: { registeredAt: 'desc' }
    });
  } catch (error) {
    console.error("getAllCasosMantenimientoAction Error:", error);
    return [];
  }
}

export async function getCasoMantenimientoByIdAction(id: string) {
   try {
    return await prisma.casoDeMantenimiento.findUnique({
      where: { id },
      include: {
        registeredByUser: { select: { name: true }},
        log: {
          include: { user: { select: { name: true }}},
          orderBy: { timestamp: 'desc' }
        }
      }
    });
  } catch (error) {
    console.error(`getCasoMantenimientoByIdAction Error for ID ${id}:`, error);
    return null;
  }
}


export async function updateCasoMantenimientoAction(
  casoId: string,
  updates: z.infer<typeof UpdateCasoMantenimientoFormSchema>,
  actingUserId: string,
  actingUserName: string,
  actingUserEmail: string
): Promise<{ success: boolean; message: string; }> {
  try {
   const validatedFields = UpdateCasoMantenimientoFormSchema.safeParse(updates);
   if (!validatedFields.success) {
    console.error("updateCasoMantenimientoAction Validation Errors:", validatedFields.error.flatten().fieldErrors);
     return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
   }
   const { currentStatus, notes, assignedProviderName, nextFollowUpDate, resolutionDetails, cost, invoicingDetails, resolvedAt } = validatedFields.data;

    const casoToUpdate = await prisma.casoDeMantenimiento.findUnique({ where: { id: casoId }});
    if (!casoToUpdate) {
      console.error(`updateCasoMantenimientoAction: Caso with ID ${casoId} not found.`);
      return { success: false, message: "Caso no encontrado." };
    }

    const dataToUpdate: any = {
        currentStatus: currentStatus as PrismaCasoMantenimientoStatus,
        assignedProviderName,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        lastFollowUpDate: new Date(),
    };

    if (currentStatus === "Resuelto") {
        if (!resolutionDetails || !resolvedAt) {
            console.error("updateCasoMantenimientoAction: Resolution details and date are required for 'Resuelto' status.");
            return { success: false, message: "Para el estado 'Resuelto', los Detalles de Resolución y la Fecha de Resolución son obligatorios."};
        }
        dataToUpdate.resolutionDetails = resolutionDetails;
        dataToUpdate.cost = cost;
        dataToUpdate.invoicingDetails = invoicingDetails || null;
        dataToUpdate.resolvedAt = new Date(resolvedAt);
    } else {
        dataToUpdate.resolutionDetails = null;
        dataToUpdate.cost = null;
        dataToUpdate.invoicingDetails = null;
        dataToUpdate.resolvedAt = null;
    }

    await prisma.$transaction(async (tx) => {
        await tx.casoDeMantenimiento.update({
            where: { id: casoId },
            data: dataToUpdate
        });
        await tx.casoMantenimientoLogEntry.create({
            data: {
                casoDeMantenimientoId: casoId,
                action: `Actualización de Estado: ${currentStatus}`,
                notes: notes,
                userId: actingUserId,
                userName: actingUserName,
                statusAfterAction: currentStatus as PrismaCasoMantenimientoStatus
            }
        });
    });

    await logAuditEvent(actingUserEmail, `Actualización de Caso de Mantenimiento: ${currentStatus}`, `ID Caso: ${casoId}. Notas: ${notes}`);
    await sendNtfyNotification({
      title: `Caso de Mantenimiento #${casoId} Actualizado`,
      message: `El caso "${casoToUpdate.title}" cambió a estado ${currentStatus}. Notas: ${notes.substring(0,50)}...`,
      tags: ['mantenimiento', 'actualizacion-estado', casoId, currentStatus.toLowerCase().replace(/\s|\//g, '-')],
    });

    revalidatePath(`/mantenimiento/${casoId}`);
    revalidatePath("/mantenimiento");
    return { success: true, message: `Caso de mantenimiento actualizado a ${currentStatus}.` };
   } catch (error) {
     console.error("updateCasoMantenimientoAction Error:", error);
     await logAuditEvent(actingUserEmail, "Error en Actualización de Caso de Mantenimiento", `ID Caso: ${casoId}, Error: ${error instanceof Error ? error.message : String(error)}`);
     return { success: false, message: "Error de base de datos al actualizar caso de mantenimiento." };
   }
}

    
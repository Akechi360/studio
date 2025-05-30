
"use server";

import { z } from "zod";
import { prisma } from "./db";
import bcrypt from 'bcryptjs';

import type { AttachmentClientData, ExcelInventoryItemData, User as UserType } from "./types"; // Keep User from types.ts for client-side compatibility
import type {
  User as PrismaUser,
  Ticket as TicketTypePrisma,
  Comment as CommentTypePrisma,
  Attachment as AttachmentTypePrisma,
  InventoryItem as InventoryItemTypePrisma,
  ApprovalRequest as ApprovalRequestTypePrisma,
  PaymentInstallment as PaymentInstallmentTypePrisma,
  ApprovalActivityLogEntry as ApprovalActivityLogEntryTypePrisma,
  CasoDeMantenimiento as CasoDeMantenimientoTypePrisma,
  CasoMantenimientoLogEntry as CasoMantenimientoLogEntryTypePrisma,
  AuditLogEntry as AuditLogEntryTypePrisma,
  Role,
  TicketPriority,
  TicketStatus,
  ApprovalRequestType,
  ApprovalStatus,
  PaymentType,
  InventoryItemCategory,
  InventoryItemStatus,
  StorageType,
  CasoMantenimientoStatus,
  CasoMantenimientoPriority
} from "@prisma/client";

import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "../lib/constants";
import { INVENTORY_ITEM_CATEGORIES, INVENTORY_ITEM_STATUSES, RAM_OPTIONS, STORAGE_TYPES_ZOD_ENUM, CASO_STATUSES, CASO_PRIORITIES } from "../lib/types";

import {
  BaseInventoryItemSchema,
  CreateApprovalRequestActionSchema,
  ApprovePagoProveedorContadoSchema,
  ApprovePagoProveedorCuotasSchema,
  ApproveCompraSchema,
  RejectOrInfoActionSchema,
  CreateCasoMantenimientoFormSchema,
  UpdateCasoMantenimientoFormSchema,
} from "../lib/schemas";
import { revalidatePath } from "next/cache";
import { sendNtfyNotification } from "./ntfy";


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
  }
}

export async function getAuditLogs(): Promise<AuditLogEntryTypePrisma[]> {
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

// --- Authentication Server Actions ---

export async function loginUserServerAction(email: string, pass: string): Promise<{ success: boolean; user: Omit<PrismaUser, 'password'> | null; message?: string }> {
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
    await logAuditEvent(email, "Intento de Inicio de Sesión Fallido");
    return { success: false, user: null, message: "Correo electrónico o contraseña no válidos." };
  } catch (error) {
    console.error("loginUserServerAction Error:", error);
    return { success: false, user: null, message: "Error del servidor durante el inicio de sesión." };
  }
}

export async function registerUserServerAction(name: string, email: string, pass: string): Promise<{ success: boolean; user: Omit<PrismaUser, 'password'> | null; message?: string }> {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, user: null, message: "Este correo electrónico ya está en uso." };
    }
    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "User", // Default role
        avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,2).toUpperCase()}`,
      },
    });
    const { password, ...userToReturn } = newUser;
    await logAuditEvent(email, "Registro de Nuevo Usuario");
    return { success: true, user: userToReturn, message: "Registro exitoso." };
  } catch (error) {
    console.error("registerUserServerAction Error:", error);
    return { success: false, user: null, message: "Error del servidor durante el registro." };
  }
}

export async function getUserByIdServerAction(userId: string): Promise<Omit<PrismaUser, 'password'> | null> {
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

export async function updateUserProfileServerAction(userId: string, name: string, email: string): Promise<{ success: boolean; user: Omit<PrismaUser, 'password'> | null; message?: string }> {
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
    await logAuditEvent(email, "Actualización de Perfil");
    revalidatePath("/profile");
    revalidatePath("/admin/users");
    return { success: true, user: userToReturn, message: "Perfil actualizado." };
  } catch (error) {
    console.error("updateUserProfileServerAction Error:", error);
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
    await logAuditEvent(userToUpdate.email, "Actualización de Contraseña Propia");
    return { success: true, message: "Contraseña actualizada exitosamente." };
  } catch (error) {
    console.error("updateUserPasswordServerAction Error:", error);
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
    await logAuditEvent(email, "Restablecimiento de Contraseña por Olvido");
    return { success: true, message: "Contraseña restablecida exitosamente." };
  } catch (error) {
    console.error("resetUserPasswordByEmailServerAction Error:", error);
    return { success: false, message: "Error del servidor al restablecer la contraseña." };
  }
}

export async function getAllUsersServerAction(): Promise<Omit<PrismaUser, 'password'>[]> {
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
  data: Partial<Pick<PrismaUser, 'name' | 'role' | 'email' | 'department' | 'password'>>
): Promise<{ success: boolean; message?: string }> {
  try {
    const updateData: any = {
      name: data.name,
      role: data.role as Role,
      email: data.email,
      department: data.department,
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
        return { success: false, message: "Un administrador no puede eliminar su propia cuenta." };
    }

    await prisma.user.delete({ where: { id: userId } });
    await logAuditEvent(adminEmail, "Eliminación de Usuario por Admin", `Usuario ID: ${userId}, Email: ${userToDelete.email}`);
    revalidatePath("/admin/users");
    return { success: true, message: "Usuario eliminado." };
  } catch (error: any) {
    console.error("deleteUserByAdminServerAction Error:", error);
    if (error.code === 'P2003' || error.code === 'P2014' ) {
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
  userEmail: z.string().email(),
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
) {
  const validatedFields = CreateTicketClientSchema.safeParse(values);

  if (!validatedFields.success) {
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
        priority,
        status: "Open",
        userId,
        userName,
        userEmail,
      }
    });

    await logAuditEvent(userEmail, "Creación de Ticket", `Ticket Asunto: ${subject}, ID: ${newTicket.id}`);
    
    // Send NTFY notification
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
    return {
      success: false,
      message: "Error de base de datos al crear el ticket.",
    };
  }
}

export async function addCommentAction(
  ticketId: string,
  commenter: Pick<PrismaUser, 'id' | 'name' | 'email' | 'avatarUrl'>,
  values: z.infer<typeof AddCommentClientSchema>
) {
  const validatedFields = AddCommentClientSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al añadir comentario debido a errores de validación.",
    };
  }

  if (!commenter.id || !commenter.email || !commenter.name) {
    return { success: false, message: "Información del comentador incompleta." };
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        text: validatedFields.data.text,
        ticketId,
        userId: commenter.id,
        userName: commenter.name,
        userAvatarUrl: commenter.avatarUrl,
      }
    });
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    await logAuditEvent(commenter.email, "Adición de Comentario", `Ticket ID: ${ticketId}, Usuario: ${commenter.name}`);
    
    await sendNtfyNotification({
      title: `Nuevo Comentario en Ticket #${ticketId}`,
      message: `${commenter.name} comentó: "${validatedFields.data.text.substring(0,50)}..."`,
      tags: ['ticket', 'comentario', ticketId],
      // click: `YOUR_APP_URL/tickets/${ticketId}` // Consider adding click URL
    });

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "¡Comentario añadido exitosamente!",
      comment: newComment,
    };
  } catch (error) {
    console.error("addCommentAction Error:", error);
    return {
      success: false,
      message: "Error de base de datos al añadir comentario.",
    };
  }
}

export async function updateTicketStatusAction(
  ticketId: string,
  values: z.infer<typeof UpdateTicketStatusClientSchema>
) {
  const validatedFields = UpdateTicketStatusClientSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al actualizar estado debido a errores de validación.",
    };
  }
  const { status, actingUserEmail } = validatedFields.data;

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: "Ticket no encontrado." };
    const oldStatus = ticket.status;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() }
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
    return { success: false, message: "Error de base de datos al actualizar estado." };
  }
}

export async function getTicketById(ticketId: string): Promise<(TicketTypePrisma & { comments: CommentTypePrisma[], attachments: AttachmentTypePrisma[], user: { name: string | null, email: string | null } | null }) | null> {
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

export async function getAllTickets(): Promise<(TicketTypePrisma & { comments: CommentTypePrisma[], attachments: AttachmentTypePrisma[], user: { name: string | null } | null })[]> {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        user: { select: { name: true }},
        comments: { select: { id: true } },
        attachments: { select: { id: true, fileName: true, url: true, size: true }}
      }
    });
    const priorityOrder: Record<TicketPriority, number> = { High: 0, Medium: 1, Low: 2 };
    tickets.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return tickets.map(t => ({...t, comments: t.comments || [], attachments: t.attachments || []}));
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
    byPriorityDb.forEach(p => { priorityMap[p.priority] = p._count.id; });

    const statusMap = TICKET_STATUSES_ENGLISH.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as Record<TicketStatus, number>);
    byStatusDb.forEach(s => { statusMap[s.status] = s._count.id; });

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

export async function getAllInventoryItems(): Promise<(InventoryItemTypePrisma & { addedByUser: { name: string | null } | null })[]> {
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
): Promise<{ success: boolean; message: string; item?: InventoryItemTypePrisma, errors?: any }> {
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

  try {
    const dataToCreate = {
      name: data.name,
      category: data.category,
      brand: data.brand || null,
      model: data.model || null,
      serialNumber: data.serialNumber || null,
      processor: data.processor || null,
      ram: data.ram || null,
      storageType: data.storageType || null,
      storage: data.storage || null,
      quantity: data.quantity,
      location: data.location || null,
      status: data.status,
      notes: data.notes || null,
      addedByUserId: currentUser.id,
      addedByUserName: currentUser.name,
    };
    
    const newItem = await prisma.inventoryItem.create({
      data: dataToCreate,
    });

    await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo Nombre: ${data.name}, ID: ${newItem.id}`);
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${data.name}" con ID "${newItem.id}" añadido exitosamente.`, item: newItem };
  } catch (error: any) {
    console.error("addInventoryItemAction Error:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
      return { success: false, message: "Error: El número de serie ya existe en el inventario." };
    }
    return { success: false, message: `Error de base de datos al añadir artículo. ${error.message}` };
  }
}

export async function updateInventoryItemAction(
  itemId: string,
  actingUserEmail: string,
  values: z.infer<typeof BaseInventoryItemSchema>
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al actualizar artículo debido a errores de validación." };
  }
  const data = validatedFields.data;

  try {
    const itemToUpdate = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!itemToUpdate) return { success: false, message: "Artículo no encontrado." };

    const dataToUpdate = {
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        processor: data.processor || null,
        ram: data.ram || null,
        storageType: data.storageType || null,
        storage: data.storage || null,
        quantity: data.quantity,
        location: data.location || null,
        status: data.status,
        notes: data.notes || null,
        updatedAt: new Date()
      };

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: dataToUpdate
    });

    await logAuditEvent(actingUserEmail, "Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${data.name}`);
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${data.name}" actualizado exitosamente.`, item: updatedItem };
  } catch (error: any) {
    console.error("updateInventoryItemAction Error:", error);
     if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
      return { success: false, message: "Error: El número de serie ya existe en el inventario para otro artículo." };
    }
    return { success: false, message: `Error de base de datos al actualizar artículo. ${error.message}` };
  }
}

export async function deleteInventoryItemAction(itemId: string, actingUserEmail: string) {
  try {
    const itemToDelete = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!itemToDelete) return { success: false, message: "Artículo no encontrado para eliminar." };

    await prisma.inventoryItem.delete({ where: { id: itemId } });

    await logAuditEvent(actingUserEmail, "Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${itemToDelete.name}`);
    revalidatePath("/inventory");
    return { success: true, message: "Artículo eliminado exitosamente." };
  } catch (error) {
    console.error("deleteInventoryItemAction Error:", error);
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
      let value = row[excelHeader];
      if (value === null || value === undefined || String(value).trim() === "") {
        (mapped as any)[internalField] = undefined;
        continue;
      }
      
      if (internalField === 'quantity') {
        const parsedQuantity = parseInt(String(value), 10);
        (mapped as any)[internalField] = isNaN(parsedQuantity) ? undefined : parsedQuantity;
      } else if (internalField === 'category') {
        const normalizedValue = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        const foundValue = INVENTORY_ITEM_CATEGORIES.find(opt => opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      } else if (internalField === 'status') {
         const normalizedValue = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
         const foundValue = INVENTORY_ITEM_STATUSES.find(opt => opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      } else if (internalField === 'ram') {
        const normalizedValue = String(value).trim().toUpperCase().replace(/\s+/g,"");
        const foundValue = RAM_OPTIONS.find(opt => opt.toUpperCase().replace(/\s+/g,"") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      } else if (internalField === 'storageType') {
        const normalizedValue = String(value).trim().toUpperCase().replace(/\s+/g,"");
        const foundValue = STORAGE_TYPES_ZOD_ENUM.find(opt => opt.toUpperCase().replace(/\s+/g,"") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      }
      else {
         (mapped as any)[internalField] = String(value).trim();
      }
    }
  }
  if (mapped.quantity === undefined || isNaN(Number(mapped.quantity))) mapped.quantity = 1;
  if (mapped.status === undefined) mapped.status = "En Uso" as InventoryItemStatus;
  return mapped;
};

export async function importInventoryItemsAction(
  itemDataArray: ExcelInventoryItemData[],
  currentUserEmail: string,
  currentUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string; successCount: number; errorCount: number; errors: { row: number; message: string; data: ExcelInventoryItemData }[]; importedItems: InventoryItemTypePrisma[] }> {
  let successCount = 0;
  let errorCount = 0;
  const errors: { row: number; message: string; data: ExcelInventoryItemData }[] = [];
  const importedItems: InventoryItemTypePrisma[] = [];

  if (!itemDataArray || itemDataArray.length === 0) {
    return { success: false, message: "No se proporcionaron datos para importar o el archivo está vacío.", successCount: 0, errorCount: itemDataArray?.length || 0, errors: [{ row: 0, message: "Archivo vacío o sin datos.", data: {} }], importedItems: [] };
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

        const dataToCreate = {
          ...validatedFields.data,
          serialNumber: validatedFields.data.serialNumber || null,
          brand: validatedFields.data.brand || null,
          model: validatedFields.data.model || null,
          processor: validatedFields.data.processor || null,
          ram: validatedFields.data.ram || null,
          storageType: validatedFields.data.storageType || null,
          storage: validatedFields.data.storage || null,
          location: validatedFields.data.location || null,
          notes: validatedFields.data.notes || null,
          addedByUserId: currentUserId,
          addedByUserName: currentUserName,
        };
        // Ensure Category is valid before prefix generation
        if (!INVENTORY_ITEM_CATEGORIES.includes(dataToCreate.category)) {
            throw new Error(`Categoría inválida '${dataToCreate.category}' encontrada.`);
        }
        const newItem = await prisma.inventoryItem.create({ data: dataToCreate as any });
        importedItems.push(newItem);
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
      importedItems
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
      importedItems
    };
  }
}


// --- Approval Actions ---
export async function createApprovalRequestAction(
  values: z.infer<typeof CreateApprovalRequestActionSchema>
): Promise<{ success: boolean; message: string; approvalId?: string; errors?: any }> {
  const validatedFields = CreateApprovalRequestActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación." };
  }
  const data = validatedFields.data;

  try {
    const newApproval = await prisma.approvalRequest.create({
      data: {
        type: data.type,
        subject: data.subject,
        description: data.description || null,
        status: "Pendiente",
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
        attachments: data.attachmentsData && data.attachmentsData.length > 0 ? {
          createMany: {
            data: data.attachmentsData.map(att => ({
              fileName: att.fileName,
              url: "placeholder/url/" + att.fileName, // Placeholder, replace with actual storage URL
              size: att.size,
              type: att.type || 'application/octet-stream',
            }))
          }
        } : undefined,
        activityLog: {
          create: [{
            action: "Solicitud Creada",
            userId: data.requesterId,
            userName: data.requesterName,
            comment: "Solicitud creada inicialmente.",
          }]
        }
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
    return { success: false, message: "Error de base de datos al crear solicitud de aprobación." };
  }
}


export async function getApprovalRequestsForUser(userId: string, userRole: Role): Promise<ApprovalRequestTypePrisma[]> {
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

export async function getApprovalRequestDetails(id: string): Promise<(ApprovalRequestTypePrisma & { attachments: AttachmentTypePrisma[], activityLog: (ApprovalActivityLogEntryTypePrisma & { user: { name: string | null } | null })[], paymentInstallments: PaymentInstallmentTypePrisma[] }) | null> {
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
  values: any
): Promise<{ success: boolean; message: string }> {
  const { requestId, approverId, approverName, approverEmail, comment, approvedPaymentType, approvedAmount, installments } = values;

  if (!requestId || !approverId || !approverName || !approverEmail) {
    return { success: false, message: "Información del aprobador incompleta."};
  }

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, message: "Solicitud no encontrada." };
    if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      return { success: false, message: "La solicitud no está en un estado que permita aprobación." };
    }

    let validatedData;
    if (request.type === "PagoProveedor") {
        if (approvedPaymentType === "Contado") {
            validatedData = ApprovePagoProveedorContadoSchema.parse(values);
        } else if (approvedPaymentType === "Cuotas") {
            validatedData = ApprovePagoProveedorCuotasSchema.parse(values);
        } else {
            return { success: false, message: "Tipo de pago no válido para Pago a Proveedor." };
        }
    } else if (request.type === "Compra") {
        validatedData = ApproveCompraSchema.parse(values);
    } else {
        return { success: false, message: "Tipo de solicitud desconocida." };
    }

    await prisma.$transaction(async (tx) => {
        const updateData: any = {
            status: "Aprobado" as ApprovalStatus,
            approverId,
            approverComment: validatedData.comment || null,
            approvedAt: new Date(),
            approverName: approverName,
            approverEmail: approverEmail,
        };

        if (request.type === "PagoProveedor") {
            updateData.approvedPaymentType = validatedData.approvedPaymentType as PaymentType;
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
    if (error instanceof z.ZodError) {
        return { success: false, message: "Error de validación: " + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') };
    }
    return { success: false, message: "Error de base de datos al aprobar la solicitud." };
  }
}


export async function rejectRequestAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, message: "Solicitud no encontrada." };
     if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      return { success: false, message: "La solicitud no está en un estado que permita rechazo." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: "Rechazado" as ApprovalStatus,
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
    return { success: false, message: "Error de base de datos al rechazar solicitud." };
  }
}

export async function requestMoreInfoAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, message: "Solicitud no encontrada." };
     if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      return { success: false, message: "La solicitud no está en un estado que permita solicitar más información." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: "InformacionSolicitada" as ApprovalStatus,
                infoRequestedAt: new Date(),
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
  const validatedFields = CreateCasoMantenimientoFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación al crear el caso." };
  }
  const data = validatedFields.data;

  try {
    const newCaso = await prisma.casoDeMantenimiento.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        equipment: data.equipment || null,
        priority: data.priority,
        assignedProviderName: data.assignedProviderName,
        currentStatus: "Registrado",
        registeredAt: new Date(),
        registeredByUserId: currentUserId,
        registeredByUserName: currentUserName,
        log: {
          create: [{
            action: "Caso Registrado",
            notes: "Caso de mantenimiento inicial registrado.",
            userId: currentUserId,
            userName: currentUserName,
            statusAfterAction: "Registrado"
          }]
        }
      }
    });

    await logAuditEvent(currentUserEmail, "Registro de Nuevo Caso de Mantenimiento", `Título: ${data.title}, ID: ${newCaso.id}`);
    
    await sendNtfyNotification({
      title: `Nuevo Caso de Mantenimiento: ${data.title.substring(0,30)}...`,
      message: `Caso #${newCaso.id} (${data.title}) registrado por ${currentUserName}. Proveedor: ${data.assignedProviderName}.`,
      tags: ['mantenimiento', 'nuevo', data.priority.toLowerCase()],
      priority: data.priority === 'Crítica' ? 5 : (data.priority === 'Alta' ? 4 : 3),
    });

    revalidatePath("/mantenimiento");
    revalidatePath(`/mantenimiento/${newCaso.id}`);

    return {
      success: true,
      message: "Caso de mantenimiento registrado exitosamente.",
      casoId: newCaso.id,
    };
  } catch (error) {
    console.error("createCasoMantenimientoAction Error:", error);
    return { success: false, message: "Error de base de datos al crear caso de mantenimiento." };
  }
}

export async function getAllCasosMantenimientoAction(): Promise<(CasoDeMantenimientoTypePrisma & { log: CasoMantenimientoLogEntryTypePrisma[], registeredByUser: { name: string | null } | null })[]> {
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

export async function getCasoMantenimientoByIdAction(id: string): Promise<(CasoDeMantenimientoTypePrisma & { log: (CasoMantenimientoLogEntryTypePrisma & {user: { name: string | null } | null})[], registeredByUser: { name: string | null } | null }) | null> {
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
   const validatedFields = UpdateCasoMantenimientoFormSchema.safeParse(updates);
   if (!validatedFields.success) {
     return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
   }
   const { currentStatus, notes, assignedProviderName, nextFollowUpDate, resolutionDetails, cost, invoicingDetails, resolvedAt } = validatedFields.data;

   try {
    const casoToUpdate = await prisma.casoDeMantenimiento.findUnique({ where: { id: casoId }});
    if (!casoToUpdate) return { success: false, message: "Caso no encontrado." };

    const dataToUpdate: any = { 
        currentStatus: currentStatus,
        assignedProviderName,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        lastFollowUpDate: new Date(),
    };

    if (currentStatus === "Resuelto") {
        if (!resolutionDetails || !resolvedAt) {
            return { success: false, message: "Para el estado 'Resuelto', los Detalles de Resolución y la Fecha de Resolución son obligatorios."};
        }
        dataToUpdate.resolutionDetails = resolutionDetails;
        dataToUpdate.cost = cost;
        dataToUpdate.invoicingDetails = invoicingDetails || null;
        dataToUpdate.resolvedAt = new Date(resolvedAt);
    } else {
        // Ensure these are nulled out if not 'Resuelto'
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
                casoId: casoId,
                action: `Actualización de Estado: ${currentStatus}`,
                notes: notes,
                userId: actingUserId,
                userName: actingUserName,
                statusAfterAction: currentStatus
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
     return { success: false, message: "Error de base de datos al actualizar caso de mantenimiento." };
   }
}

// AI Solution Suggestion Action (No longer used, but kept for reference if needed later)
// import {ai} from '@/ai/genkit';
// import {suggestSolution, SuggestSolutionInput} from '@/ai/flows/suggest-solution';
// export async function getAISolutionSuggestion(ticketDescription: string): Promise<{ suggestion?: string; error?: string }> {
//   try {
//     const input: SuggestSolutionInput = { ticketDescription };
//     const result = await suggestSolution(input);
//     return { suggestion: result.suggestedSolution };
//   } catch (error: any) {
//     console.error("Error getting AI suggestion:", error);
//     return { error: error.message || "Failed to get suggestion from AI." };
//   }
// }


"use server";

import { z } from "zod";
import { prisma } from "./db";
import bcrypt from 'bcryptjs';

// Import Prisma types (interfaces, model types)
import type {
  User as PrismaUserType, // Using a more distinct alias for the Prisma User model type
  Attachment as PrismaAttachment,
  Comment as PrismaComment,
  Ticket as PrismaTicket,
  InventoryItem as PrismaInventoryItem,
  ApprovalRequest as PrismaApprovalRequest,
  PaymentInstallment as PrismaPaymentInstallment,
  ApprovalActivityLogEntry as PrismaApprovalActivityLogEntry,
  CasoDeMantenimiento as PrismaCasoDeMantenimiento,
  CasoMantenimientoLogEntry as PrismaCasoMantenimientoLogEntry,
  AuditLogEntry as PrismaAuditLogEntry
} from "@prisma/client";

// Import Prisma enums (used as values)
import {
  Role as PrismaRole,
  TicketPriority as PrismaTicketPriority,
  TicketStatus as PrismaTicketStatus,
  ApprovalRequestType as PrismaApprovalRequestType,
  ApprovalStatus as PrismaApprovalStatus,
  PaymentType as PrismaPaymentType,
  InventoryItemCategory as PrismaInventoryItemCategory,
  InventoryItemStatus as PrismaInventoryItemStatus,
  StorageType as PrismaStorageType,
  RamOption as PrismaRamOption,
  CasoMantenimientoStatus as PrismaCasoMantenimientoStatus,
  CasoMantenimientoPriority as PrismaCasoMantenimientoPriority
} from "@prisma/client";

import type { AttachmentClientData, ExcelInventoryItemData, User as ClientUserType } from "./types"; // Keep User from types.ts for client-side compatibility
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types";
import {
  TICKET_PRIORITIES_ENGLISH,
  TICKET_STATUSES_ENGLISH,
} from "./constants";
import {
  INVENTORY_ITEM_CATEGORIES,
  INVENTORY_ITEM_STATUSES,
  RAM_OPTIONS as ClientRamOptions, // Renamed to avoid conflict
  STORAGE_TYPES_ZOD_ENUM,
  CASO_STATUSES,
  CASO_PRIORITIES,
  TicketPriority as ClientTicketPriority,   // Client-side string type
  TicketStatus as ClientTicketStatus,   // Client-side string type
  InventoryItemCategory as ClientInventoryItemCategory, // Client-side string type
  InventoryItemStatus as ClientInventoryItemStatus,   // Client-side string type
  RamOption as ClientRamOptionType, // Client-side string type for RAM
  StorageType as ClientStorageType, // Client-side string type for Storage
  CasoMantenimientoStatus as ClientCasoMantenimientoStatus, // Client-side string type
  CasoMantenimientoPriority as ClientCasoMantenimientoPriority, // Client-side string type
  PaymentType as ClientPaymentType, // Client-side string type
  ApprovalRequestType as ClientApprovalRequestType // Client-side string type
} from "./types";

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

export async function getAuditLogs(): Promise<PrismaAuditLogEntry[]> {
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

export async function loginUserServerAction(email: string, pass: string): Promise<{ success: boolean; user: Omit<PrismaUserType, 'password'> | null; message?: string }> {
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

export async function registerUserServerAction(name: string, email: string, pass: string): Promise<{ success: boolean; user: Omit<PrismaUserType, 'password'> | null; message?: string }> {
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
        role: PrismaRole.User, // Default role
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

export async function getUserByIdServerAction(userId: string): Promise<Omit<PrismaUserType, 'password'> | null> {
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

export async function updateUserProfileServerAction(userId: string, name: string, email: string): Promise<{ success: boolean; user: Omit<PrismaUserType, 'password'> | null; message?: string }> {
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
    if (currentUserData.email) {
        await logAuditEvent(currentUserData.email, "Actualización de Perfil", `Usuario ID: ${userId}, Antiguo Email: ${currentUserData.email}, Nuevo Email: ${email}`);
    }
    revalidatePath("/profile");
    revalidatePath("/admin/users");
    return { success: true, user: userToReturn, message: "Perfil actualizado." };
  } catch (error) {
    console.error("updateUserProfileServerAction Error:", error);
    const userEmailForLog = (await prisma.user.findUnique({where: {id: userId}}))?.email || 'unknown_user_profile_update';
    await logAuditEvent(userEmailForLog, "Error en Actualización de Perfil", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`);
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
    const userEmailForLog = (await prisma.user.findUnique({where: {id: userId}}))?.email || 'unknown_user_for_password_update';
    await logAuditEvent(userEmailForLog, "Error en Actualización de Contraseña Propia", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`);
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

export async function getAllUsersServerAction(): Promise<Omit<PrismaUserType, 'password'>[]> {
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
  data: Partial<Pick<ClientUserType, 'name' | 'role' | 'email' | 'department' | 'password'>>
): Promise<{ success: boolean; message?: string }> {
  try {
    const updateData: any = { // Consider using Prisma.UserUpdateInput for better typing
      name: data.name,
      role: data.role as PrismaRole,
      email: data.email,
      department: data.department === "_NO_DEPARTMENT_" ? null : data.department || null,
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

    await prisma.user.delete({ where: { id: userId } });
    await logAuditEvent(adminEmail, "Eliminación de Usuario por Admin", `Usuario ID: ${userId}, Email: ${userToDelete.email}`);
    revalidatePath("/admin/users");
    return { success: true, message: "Usuario eliminado." };
  } catch (error: any) {
    console.error("deleteUserByAdminServerAction Error:", error);
    await logAuditEvent(adminEmail, "Error en Eliminación de Usuario por Admin", `Usuario ID: ${userId}, Error: ${error.message || String(error)}`);
    if (error.code === 'P2003' || error.code === 'P2014' ) { // Prisma foreign key constraint error
      return { success: false, message: "No se puede eliminar el usuario porque tiene registros asociados (tickets, comentarios, etc.). Reasigna o elimina esos registros primero." };
    }
    return { success: false, message: "Error del servidor al eliminar usuario." };
  }
}


// --- Ticket Actions ---
const CreateTicketClientSchema = z.object({
  subject: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [ClientTicketPriority, ...ClientTicketPriority[]]),
  userEmail: z.string().email(),
});

const AddCommentClientSchema = z.object({
  text: z.string().min(1).max(1000),
});

const UpdateTicketStatusClientSchema = z.object({
  status: z.enum(TICKET_STATUSES_ENGLISH as [ClientTicketStatus, ...ClientTicketStatus[]]),
  actingUserEmail: z.string().email(),
});


export async function createTicketAction(
  userId: string,
  userName: string,
  values: z.infer<typeof CreateTicketClientSchema>
): Promise<{ success: boolean; message: string; ticketId?: string; errors?: any }> {
  try {
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

    const newTicket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority: priority as PrismaTicketPriority,
        status: PrismaTicketStatus.Open,
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
    const emailForLog = values.userEmail || 'unknown_user_ticket_creation';
    await logAuditEvent(emailForLog, "Error en Creación de Ticket", `Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      message: "Error de base de datos al crear el ticket.",
    };
  }
}

export async function addCommentAction(
  ticketId: string,
  commenter: Pick<ClientUserType, 'id' | 'name' | 'email' | 'avatarUrl'>,
  values: z.infer<typeof AddCommentClientSchema>
): Promise<{ success: boolean; message: string; commentId?: string, errors?: any }> {
  try {
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
    const emailForLog = commenter.email || 'unknown_user_comment_creation';
    await logAuditEvent(emailForLog, "Error en Adición de Comentario", `Ticket ID: ${ticketId}, Error: ${error instanceof Error ? error.message : String(error)}`);
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
  try {
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
        acc[s] = s; // This was incorrect, should map to Spanish values
        return acc;
    }, {} as Record<string, string>);


    return { success: true, message: `Estado del ticket actualizado a ${statusDisplayMap[status] || status}.` };
  } catch (error) {
    console.error("updateTicketStatusAction Error:", error);
    const emailForLog = values.actingUserEmail || 'unknown_user_status_update';
    await logAuditEvent(emailForLog, "Error en Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, Error: ${error instanceof Error ? error.message : String(error)}`);
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
        { priority: 'desc'}, // Prisma expects enum members directly for orderBy if it's an enum field
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
    const open = await prisma.ticket.count({ where: { status: PrismaTicketStatus.Open } });
    const inProgress = await prisma.ticket.count({ where: { status: PrismaTicketStatus.InProgress } });
    const resolved = await prisma.ticket.count({ where: { status: PrismaTicketStatus.Resolved } });
    const closed = await prisma.ticket.count({ where: { status: PrismaTicketStatus.Closed } });

    const summary = { total, open, inProgress, resolved, closed };

    const byPriorityDb = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true },
    });
    const byStatusDb = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const priorityMap = TICKET_PRIORITIES_ENGLISH.reduce((acc, p) => { acc[p as ClientTicketPriority] = 0; return acc; }, {} as Record<ClientTicketPriority, number>);
    byPriorityDb.forEach(p => { priorityMap[p.priority as ClientTicketPriority] = p._count.id; });

    const statusMap = TICKET_STATUSES_ENGLISH.reduce((acc, s) => { acc[s as ClientTicketStatus] = 0; return acc; }, {} as Record<ClientTicketStatus, number>);
    byStatusDb.forEach(s => { statusMap[s.status as ClientTicketStatus] = s._count.id; });

    const stats = {
      byPriority: TICKET_PRIORITIES_ENGLISH.map(pKey => ({
        name: pKey as string,
        value: priorityMap[pKey as ClientTicketPriority],
      })),
      byStatus: TICKET_STATUSES_ENGLISH.map(sKey => ({
        name: sKey as string,
        value: statusMap[sKey as ClientTicketStatus],
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

const storageTypeStringToPrismaEnumMap: Record<string, PrismaStorageType> = {
  "HDD": PrismaStorageType.HDD,
  "SSD": PrismaStorageType.SSD,
  "No Especificado": PrismaStorageType.NoEspecificado,
};

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

const categoryStringToPrismaEnumMap: Record<string, PrismaInventoryItemCategory> = INVENTORY_ITEM_CATEGORIES.reduce((acc, category) => {
  acc[category] = category as PrismaInventoryItemCategory;
  return acc;
}, {} as Record<string, PrismaInventoryItemCategory>);

const statusStringToPrismaEnumMap: Record<string, PrismaInventoryItemStatus> = INVENTORY_ITEM_STATUSES.reduce((acc, status) => {
  acc[status] = status as PrismaInventoryItemStatus;
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
  currentUser: Pick<ClientUserType, 'id' | 'name' | 'email'>,
  values: z.infer<typeof BaseInventoryItemSchema>
): Promise<{ success: boolean; message: string; itemId?: string, errors?: any }> {
  try {
    if (!currentUser || !currentUser.id || !currentUser.name || !currentUser.email) {
      return { success: false, message: "Información del usuario actual incompleta o inválida." };
    }
    const validatedFields = BaseInventoryItemSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al añadir artículo: Errores de validación." };
    }
    const data = validatedFields.data;

    const dataToCreate = {
      name: data.name,
      category: categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory],
      brand: data.brand || null,
      model: data.model || null,
      serialNumber: data.serialNumber || null,
      processor: data.processor || null,
      ram: (data.ram && data.ram !== "No Especificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOptionType] : PrismaRamOption.NoEspecificado) || null,
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
    return { success: true, message: `Artículo "${data.name}" (ID: ${newItem.id}) añadido exitosamente.`, itemId: newItem.id };
  } catch (error: any) {
    console.error("addInventoryItemAction Error:", error);
    const userEmailForLog = currentUser?.email || 'unknown_user_for_add_item';
    await logAuditEvent(userEmailForLog, "Error en Adición de Artículo de Inventario", `Error: ${error.message || String(error)}`);
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
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al actualizar artículo: Errores de validación." };
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
        ram: (data.ram && data.ram !== "No Especificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOptionType] : PrismaRamOption.NoEspecificado) || null,
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
  } catch (error: any) {
    console.error("deleteInventoryItemAction Error:", error);
    await logAuditEvent(actingUserEmail, "Error en Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Error: ${error.message || String(error)}`);
    return { success: false, message: `Error de base de datos al eliminar artículo: ${error.message || "Error desconocido"}.` };
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
        const foundRamValue = ClientRamOptions.find(opt => opt.toUpperCase().replace(/\s+/g,"").replace('GB','') === normalizedValue);
        mapped[internalField] = foundRamValue || "No Especificado" as ClientRamOptionType;
      } else if (internalField === 'storageType') {
        const normalizedValue = String(value).trim().toUpperCase().replace(/\s+/g,"");
        const foundStorageType = STORAGE_TYPES_ZOD_ENUM.find(opt => opt.toUpperCase().replace(/\s+/g,"") === normalizedValue);
        mapped[internalField] = (foundStorageType === "No Especificado" ? undefined : foundStorageType) as ClientStorageType | undefined;
      }
      else {
         mapped[internalField] = String(value).trim();
      }
    }
  }
  if (mapped.quantity === undefined || isNaN(Number(mapped.quantity))) mapped.quantity = 1;
  if (mapped.status === undefined) mapped.status = "En Uso" as ClientInventoryItemStatus;
  if (mapped.category === undefined) mapped.category = "Otro" as ClientInventoryItemCategory;
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

        if (!categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory]) {
             errorCount++;
             errors.push({ row: i + 2, message: `Error de mapeo: Categoría inválida '${data.category}' no encontrada en el sistema.`, data: rawRow });
             continue;
        }
        if (!statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus]) {
             errorCount++;
             errors.push({ row: i + 2, message: `Error de mapeo: Estado inválido '${data.status}' no encontrado en el sistema.`, data: rawRow });
             continue;
        }
        const mappedRam = (data.ram && data.ram !== "No Especificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOptionType] : PrismaRamOption.NoEspecificado) || null;
        const mappedStorageType = (data.storageType && data.storageType !== "No Especificado" ? storageTypeStringToPrismaEnumMap[data.storageType as ClientStorageType] : PrismaStorageType.NoEspecificado) || null;

        if (data.ram && data.ram !== "No Especificado" && !mappedRam) {
            errorCount++;
            errors.push({ row: i + 2, message: `Error de mapeo: RAM inválida '${data.ram}' no encontrada en el sistema.`, data: rawRow });
            continue;
        }
         if (data.storageType && data.storageType !== "No Especificado" && !mappedStorageType) {
            errorCount++;
            errors.push({ row: i + 2, message: `Error de mapeo: Tipo de Almacenamiento inválido '${data.storageType}' no encontrado.`, data: rawRow });
            continue;
        }


        const dataToCreate = {
            name: data.name,
            category: categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory],
            brand: data.brand || null,
            model: data.model || null,
            serialNumber: data.serialNumber || null,
            processor: data.processor || null,
            ram: mappedRam,
            storageType: mappedStorageType,
            storage: data.storage || null,
            quantity: data.quantity,
            location: data.location || null,
            status: statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus],
            notes: data.notes || null,
            addedByUserId: currentUserId,
            addedByUserName: currentUserName,
        };


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
      errorCount: itemDataArray.length - successCount, // This might not be accurate if globalError happens early
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
        status: PrismaApprovalStatus.Pendiente,
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
          // paymentDueDate removed as it's in description
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
              // In a real app, URL would point to actual storage (e.g., S3, Firebase Storage)
              url: "uploads/placeholder/" + Date.now() + "_" + att.fileName.replace(/\s+/g, '_'),
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
    const userEmailForLog = values.requesterEmail || 'unknown_user_for_approval_creation';
    await logAuditEvent(userEmailForLog, `Error en Creación de Solicitud de Aprobación (${values.type})`, `Error: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: "Error de base de datos al crear solicitud de aprobación." };
  }
}


export async function getApprovalRequestsForUser(userId: string, userRole: PrismaRole) {
  try {
    if (userRole === PrismaRole.PresidenteIEQ) {
      return await prisma.approvalRequest.findMany({
        where: { status: { in: [PrismaApprovalStatus.Pendiente, PrismaApprovalStatus.InformacionSolicitada] } },
        orderBy: { createdAt: 'desc' }
      });
    }
    // For Admin or specific approvers, they see requests they submitted
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
    approvedPaymentType?: ClientPaymentType; // From types.ts
    approvedAmount?: number;
    installments?: z.infer<typeof PaymentInstallmentActionSchema>[];
  }
): Promise<{ success: boolean; message: string }> {
  const { requestId, approverId, approverName, approverEmail, comment, approvedPaymentType, approvedAmount, installments } = values;

  try {
    if (!requestId || !approverId || !approverName || !approverEmail) {
      return { success: false, message: "Información del aprobador incompleta."};
    }

    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, message: "Solicitud no encontrada." };
    }
    if (request.status !== PrismaApprovalStatus.Pendiente && request.status !== PrismaApprovalStatus.InformacionSolicitada) {
      return { success: false, message: "La solicitud no está en un estado que permita aprobación." };
    }

    let validatedData: any; // Will hold data validated against more specific schemas
    if (request.type === PrismaApprovalRequestType.PagoProveedor) {
        if (approvedPaymentType === "Contado") {
            validatedData = ApprovePagoProveedorContadoSchema.parse(values);
        } else if (approvedPaymentType === "Cuotas") {
            validatedData = ApprovePagoProveedorCuotasSchema.parse(values);
        } else {
            return { success: false, message: "Tipo de pago no válido para Pago a Proveedor." };
        }
    } else if (request.type === PrismaApprovalRequestType.Compra) {
        validatedData = ApproveCompraSchema.parse(values); // Compra doesn't have paymentType/amount from approver
    } else {
        return { success: false, message: "Tipo de solicitud desconocida." };
    }

    await prisma.$transaction(async (tx) => {
        const updateData: any = {
            status: PrismaApprovalStatus.Aprobado,
            approverId,
            approverComment: validatedData.comment || null,
            approvedAt: new Date(),
            approverName: approverName,
            approverEmail: approverEmail,
        };

        if (request.type === PrismaApprovalRequestType.PagoProveedor) {
            updateData.approvedPaymentType = validatedData.approvedPaymentType as PrismaPaymentType;
            updateData.approvedAmount = validatedData.approvedAmount;

            // Always delete existing installments before creating new ones for an approval
            await tx.paymentInstallment.deleteMany({ where: { approvalRequestId: requestId }});

            if (validatedData.approvedPaymentType === "Cuotas" && validatedData.installments && validatedData.installments.length > 0) {
                await tx.paymentInstallment.createMany({
                    data: validatedData.installments.map((inst: { amount: number; dueDate: Date; }) => ({
                        amount: inst.amount,
                        dueDate: new Date(inst.dueDate), // Ensure it's a Date object
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
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, message: "Solicitud no encontrada." };
    }
     if (request.status !== PrismaApprovalStatus.Pendiente && request.status !== PrismaApprovalStatus.InformacionSolicitada) {
      return { success: false, message: "La solicitud no está en un estado que permita rechazo." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: PrismaApprovalStatus.Rechazado,
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
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, message: "Solicitud no encontrada." };
    }
     if (request.status !== PrismaApprovalStatus.Pendiente && request.status !== PrismaApprovalStatus.InformacionSolicitada) {
      return { success: false, message: "La solicitud no está en un estado que permita solicitar más información." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: PrismaApprovalStatus.InformacionSolicitada,
                infoRequestedAt: new Date(),
                // Preserve original approver if already set, otherwise set the current one
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
        currentStatus: PrismaCasoMantenimientoStatus.Registrado,
        registeredAt: new Date(),
        registeredByUserId: currentUserId,
        registeredByUserName: currentUserName,
        log: {
          create: [{
            action: "Caso Registrado",
            notes: "Caso de mantenimiento inicial registrado.",
            userId: currentUserId,
            userName: currentUserName,
            statusAfterAction: PrismaCasoMantenimientoStatus.Registrado
          }]
        }
      }
    });

    await logAuditEvent(currentUserEmail, "Registro de Nuevo Caso de Mantenimiento", `Título: ${data.title}, ID: ${newCaso.id}`);
    await sendNtfyNotification({
      title: `Nuevo Caso de Mantenimiento: ${data.title.substring(0,30)}...`,
      message: `Caso #${newCaso.id} (${data.title}) registrado por ${currentUserName}. Proveedor: ${data.assignedProviderName}.`,
      tags: ['mantenimiento', 'nuevo', data.priority.toLowerCase()],
      priority: data.priority === 'Critica' ? 5 : (data.priority === 'Alta' ? 4 : 3),
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
        log: { orderBy: { timestamp: 'desc' }} // Log entries are part of the main document now
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
        log: { // Log entries are part of the main document now
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
     return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
   }
   const { currentStatus, notes, assignedProviderName, nextFollowUpDate, resolutionDetails, cost, invoicingDetails, resolvedAt } = validatedFields.data;

    const casoToUpdate = await prisma.casoDeMantenimiento.findUnique({ where: { id: casoId }});
    if (!casoToUpdate) {
      return { success: false, message: "Caso no encontrado." };
    }

    const dataToUpdate: any = { // Consider Prisma.CasoDeMantenimientoUpdateInput
        currentStatus: currentStatus as PrismaCasoMantenimientoStatus,
        assignedProviderName,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        lastFollowUpDate: new Date(), // Always update last follow-up on any update action by Emilia
    };

    if (currentStatus === PrismaCasoMantenimientoStatus.Resuelto) {
        if (!resolutionDetails || !resolvedAt) {
            return { success: false, message: "Para el estado 'Resuelto', los Detalles de Resolución y la Fecha de Resolución son obligatorios."};
        }
        dataToUpdate.resolutionDetails = resolutionDetails;
        dataToUpdate.cost = cost;
        dataToUpdate.invoicingDetails = invoicingDetails || null;
        dataToUpdate.resolvedAt = new Date(resolvedAt);
    } else {
        // Clear closure fields if status is not 'Resuelto' to maintain data integrity
        dataToUpdate.resolutionDetails = null;
        dataToUpdate.cost = null;
        dataToUpdate.invoicingDetails = null;
        dataToUpdate.resolvedAt = null;
    }

    const newLogEntry = {
        action: `Actualización: ${currentStatus}`,
        notes: notes, // This comes from Emilia's update form
        userId: actingUserId,
        userName: actingUserName,
        statusAfterAction: currentStatus as PrismaCasoMantenimientoStatus,
        timestamp: new Date() // Ensure timestamp is set here
    };

    await prisma.casoDeMantenimiento.update({
        where: { id: casoId },
        data: {
            ...dataToUpdate,
            log: {
                create: [newLogEntry] // Create a new log entry related to this case
            }
        }
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

// AI Solution Suggestion - Removed as per user request
// export async function getAISolutionSuggestion(ticketDescription: string): Promise<{ suggestion?: string; error?: string }> {
//   // ... (code was here)
//   return { error: "AI Suggestion feature is currently disabled." };
// }

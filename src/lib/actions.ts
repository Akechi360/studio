"use server";

import { z } from "zod";
import { prisma } from "./db";
import bcrypt from 'bcryptjs';

// Import Prisma types (interfaces, model types)
import type {
  User as PrismaUserType,
  Attachment as PrismaAttachment,
  Comment as PrismaComment,
  Ticket as PrismaTicket,
  InventoryItem as PrismaInventoryItem,
  PaymentInstallment as PrismaPaymentInstallment,
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


import type { AttachmentClientData, ExcelInventoryItemData, User as ClientUserType, ApprovalStatus } from "./types";
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types"; // Asegúrate de que esta ruta sea correcta

// **** ESTAS SON LAS IMPORTACIONES CORRECTAS DE CONSTANTES Y MAPAS ****
import {
  TICKET_PRIORITIES_ENGLISH,
  TICKET_STATUSES_ENGLISH,
  TICKET_STATUSES,
  ticketStatusStringToPrismaEnumMap,
  ticketStatusPrismaEnumToStringMap, // Asegúrate de importar también si la usas aquí
  ticketPriorityStringToPrismaEnumMap, // <--- Importación de este mapa
} from "./constants";
// ********************************************************************************

import {
  INVENTORY_ITEM_CATEGORIES,
  INVENTORY_ITEM_STATUSES,
  RAM_OPTIONS as ClientRamOptions,
  STORAGE_TYPES_ZOD_ENUM,
  CASO_STATUSES,
  CASO_PRIORITIES,
  TicketPriority as ClientTicketPriority,
  TicketStatus as ClientTicketStatus,
  InventoryItemCategory as ClientInventoryItemCategory,
  InventoryItemStatus as ClientInventoryItemStatus,
  RamOption as ClientRamOptionType,
  StorageType as ClientStorageType,
  CasoMantenimientoStatus as ClientCasoMantenimientoStatus,
  CasoMantenimientoPriority as ClientCasoMantenimientoPriority,
  PaymentType as ClientPaymentType,
  ApprovalRequestType as ClientApprovalRequestType,
  Role as ClientUserRole,
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
  CreateTicketClientSchema,
  AddCommentClientSchema,
  UpdateTicketStatusClientSchema,
  UpdateUserByAdminFormSchema,
} from "./schemas";
import { sendNtfyNotification } from "./ntfy"; // [cite: 8]
import { revalidatePath } from "next/cache"; // [cite: 8]

// --- Audit Log Actions ---
export async function logAuditEvent(performingUserEmail: string, actionDescription: string, details?: string): Promise<void> { // [cite: 9]
  try {
    await prisma.auditLogEntry.create({ // [cite: 9]
      data: {
        userEmail: performingUserEmail, // [cite: 9]
        action: actionDescription, // [cite: 9]
        details: details || undefined, // [cite: 9]
      }
    });
    revalidatePath("/admin/audit"); // [cite: 10]
  } catch (error) { // [cite: 10]
    console.error("logAuditEvent Error:", error); // [cite: 10]
    // Depending on requirements, you might want to throw the error or handle it silently
  }
}

export async function getAuditLogs(): Promise<PrismaAuditLogEntry[]> { // [cite: 11]
  try {
    const logs = await prisma.auditLogEntry.findMany({ // [cite: 11]
      orderBy: { timestamp: 'desc' }, // [cite: 11]
    }); // [cite: 11]
    return logs; // [cite: 12]
  } catch (error) { // [cite: 12]
    console.error("getAuditLogs Error:", error); // [cite: 12]
    return []; // [cite: 12]
  } // [cite: 12]
}

// --- Authentication Server Actions ---

export async function loginUserServerAction(email: string, pass: string): Promise<{ success: boolean; user: Omit<PrismaUserType, 'password'> | null; // [cite: 13]
  message?: string }> { // [cite: 14]
  try {
    const dbUser = await prisma.user.findUnique({ where: { email } }); // [cite: 14]
    if (dbUser && dbUser.password) { // [cite: 15]
      const passwordMatch = await bcrypt.compare(pass, dbUser.password); // [cite: 15]
      if (passwordMatch) { // [cite: 16]
        const { password, ...userToReturn } = dbUser; // [cite: 16]
        await logAuditEvent(email, "Inicio de Sesión Exitoso"); // [cite: 17]
        return { success: true, user: userToReturn, message: "Inicio de sesión exitoso." }; // [cite: 17]
      } // [cite: 18]
    } // [cite: 18]
    await logAuditEvent(email, "Intento de Inicio de Sesión Fallido", `Intento con email: ${email}`); // [cite: 18]
    return { success: false, user: null, message: "Correo electrónico o contraseña no válidos." }; // [cite: 19]
  } catch (error) { // [cite: 20]
    console.error("loginUserServerAction Error:", error); // [cite: 20]
    await logAuditEvent(email, "Error en Inicio de Sesión", `Error: ${error instanceof Error ? error.message : String(error)}`); // [cite: 21]
    return { success: false, user: null, message: "Error del servidor durante el inicio de sesión." }; // [cite: 22]
  } // [cite: 23]
}

export async function registerUserServerAction(name: string, email: string, pass: string): Promise<{ success: boolean; user: Omit<PrismaUserType, 'password'> | null; // [cite: 23]
  message?: string }> { // [cite: 24]
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } }); // [cite: 24]
    if (existingUser) { // [cite: 25]
      return { success: false, user: null, message: "Este correo electrónico ya está en uso." // [cite: 25]
      }; // [cite: 26]
    } // [cite: 26]
    const hashedPassword = await bcrypt.hash(pass, 10); // [cite: 26]
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2); // [cite: 26]
    const newUser = await prisma.user.create({ // [cite: 27]
      data: {
        name,
        email,
        password: hashedPassword,
        role: PrismaRole.User, // Default role
        avatarUrl: `https://placehold.co/100x100.png?text=${initials}`,
      },
    }); // [cite: 27]
    const { password, ...userToReturn } = newUser; // [cite: 28]
    await logAuditEvent(email, "Registro de Nuevo Usuario", `Usuario: ${name} (${email})`); // [cite: 28]
    return { success: true, user: userToReturn, message: "Registro exitoso." }; // [cite: 29]
  } catch (error) { // [cite: 29]
    console.error("registerUserServerAction Error:", error); // [cite: 30]
    await logAuditEvent(email, "Error en Registro de Usuario", `Error: ${error instanceof Error ? error.message : String(error)}`); // [cite: 30]
    return { success: false, user: null, message: "Error del servidor durante el registro." }; // [cite: 31]
  } // [cite: 32]
}

export async function getUserByIdServerAction(userId: string): Promise<Omit<PrismaUserType, 'password'> | null> { // [cite: 32]
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } }); // [cite: 33]
    if (dbUser) { // [cite: 33]
      const { password, ...userToReturn } = dbUser; // [cite: 33]
      return userToReturn; // [cite: 34]
    } // [cite: 34]
    return null; // [cite: 34]
  } catch (error) { // [cite: 34]
    console.error("getUserByIdServerAction Error:", error); // [cite: 34]
    return null; // [cite: 35]
  } // [cite: 35]
}

export async function updateUserProfileServerAction(userId: string, name: string, email: string): Promise<{ success: boolean; user: Omit<PrismaUserType, 'password'> | null; // [cite: 35]
  message?: string }> { // [cite: 36]
  try {
    const currentUserData = await prisma.user.findUnique({ where: { id: userId }}); // [cite: 36]
    if (!currentUserData) { // [cite: 37]
        return { success: false, user: null, message: "Usuario no encontrado." // [cite: 37]
        }; // [cite: 38]
    } // [cite: 38]

    if (email && email !== currentUserData.email) { // [cite: 38]
      const existingUser = await prisma.user.findUnique({ where: { email } }); // [cite: 39]
      if (existingUser && existingUser.id !== userId) { // [cite: 39]
        return { success: false, user: null, message: "El correo electrónico ya está en uso por otro usuario." // [cite: 39]
        }; // [cite: 40]
      } // [cite: 40]
    } // [cite: 40]

    const updatedDbUser = await prisma.user.update({ // [cite: 40]
      where: { id: userId }, // [cite: 40]
      data: { name, email }, // [cite: 40]
    }); // [cite: 40]
    const { password, ...userToReturn } = updatedDbUser; // [cite: 41]
    if (currentUserData.email) { // [cite: 41]
        await logAuditEvent(currentUserData.email, "Actualización de Perfil", `Usuario ID: ${userId}, Antiguo Email: ${currentUserData.email || 'N/A'}, Nuevo Email: ${email}`); // [cite: 41]
    } // [cite: 42]
    revalidatePath("/profile"); // [cite: 42]
    revalidatePath("/admin/users"); // [cite: 42]
    return { success: true, user: userToReturn, message: "Perfil actualizado." }; // [cite: 43]
  } catch (error) { // [cite: 43]
    console.error("updateUserProfileServerAction Error:", error); // [cite: 43]
    const userEmailForLog = (await prisma.user.findUnique({where: {id: userId}}))?.email || 'unknown_user_profile_update'; // [cite: 43]
    await logAuditEvent(userEmailForLog, "Error en Actualización de Perfil", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`); // [cite: 44]
    return { success: false, user: null, message: "Error del servidor al actualizar el perfil." }; // [cite: 45]
  } // [cite: 46]
}

export async function updateUserPasswordServerAction(userId: string, newPasswordValue: string): Promise<{ success: boolean; // [cite: 46]
  message: string }> { // [cite: 47]
  try {
    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } }); // [cite: 47]
    if (!userToUpdate || !userToUpdate.email) { // [cite: 48]
        return { success: false, message: "Usuario no encontrado o email no disponible." // [cite: 48]
        }; // [cite: 49]
    } // [cite: 49]
    const hashedPassword = await bcrypt.hash(newPasswordValue, 10); // [cite: 49]
    await prisma.user.update({ // [cite: 50]
      where: { id: userId }, // [cite: 50]
      data: { password: hashedPassword }, // [cite: 50]
    }); // [cite: 50]
    await logAuditEvent(userToUpdate.email, "Actualización de Contraseña Propia", `Usuario ID: ${userId}`); // [cite: 51]
    return { success: true, message: "Contraseña actualizada exitosamente." }; // [cite: 51]
  } catch (error) { // [cite: 52]
    console.error("updateUserPasswordServerAction Error:", error); // [cite: 52]
    const userEmailForLog = (await prisma.user.findUnique({where: {id: userId}}))?.email || 'unknown_user_for_password_update'; // [cite: 52]
    await logAuditEvent(userEmailForLog, "Error en Actualización de Contraseña Propia", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`); // [cite: 53]
    return { success: false, message: "Error del servidor al actualizar la contraseña." }; // [cite: 54]
  } // [cite: 55]
}

export async function resetUserPasswordByEmailServerAction(email: string, newPasswordValue: string): Promise<{ success: boolean; // [cite: 55]
  message: string }> { // [cite: 56]
  try {
    const targetUser = await prisma.user.findUnique({ where: { email } }); // [cite: 56]
    if (!targetUser) { // [cite: 57]
      return { success: false, message: "Usuario no encontrado con ese correo." }; // [cite: 57]
    } // [cite: 58]
    const hashedPassword = await bcrypt.hash(newPasswordValue, 10); // [cite: 58]
    await prisma.user.update({ // [cite: 59]
      where: { email }, // [cite: 59]
      data: { password: hashedPassword }, // [cite: 59]
    }); // [cite: 59]
    await logAuditEvent(email, "Restablecimiento de Contraseña por Olvido", `Usuario: ${email}`); // [cite: 60]
    return { success: true, message: "Contraseña restablecida exitosamente." }; // [cite: 60]
  } catch (error) { // [cite: 61]
    console.error("resetUserPasswordByEmailServerAction Error:", error); // [cite: 61]
    await logAuditEvent(email, "Error en Restablecimiento de Contraseña", `Usuario: ${email}, Error: ${error instanceof Error ? error.message : String(error)}`); // [cite: 62]
    return { success: false, message: "Error del servidor al restablecer la contraseña." }; // [cite: 63]
  } // [cite: 64]
}

export async function getAllUsersServerAction(): Promise<Omit<PrismaUserType, 'password'>[]> { // [cite: 64]
  try {
    const dbUsers = await prisma.user.findMany({ // [cite: 64]
      orderBy: { name: 'asc' } // [cite: 65]
    }); // [cite: 65]
    return dbUsers.map(({ password, ...userWithoutPassword }) => userWithoutPassword); // [cite: 65]
  } catch (error) { // [cite: 65]
    console.error("getAllUsersServerAction Error:", error); // [cite: 65]
    return []; // [cite: 66]
  } // [cite: 66]
}


const roleStringToPrismaEnumMap: Record<string, PrismaRole> = { // [cite: 66]
  "User": PrismaRole.User, // [cite: 66]
  "Admin": PrismaRole.Admin, // [cite: 66]
  "Presidente": PrismaRole.Presidente, // [cite: 66]
}; // [cite: 66]
export async function updateUserByAdminServerAction( // [cite: 67]
  adminEmail: string, // [cite: 67]
  userId: string, // [cite: 67]
  data: z.infer<typeof UpdateUserByAdminFormSchema> // [cite: 67]
): Promise<{ success: boolean; // [cite: 67]
  message?: string }> { // [cite: 68]
  try {
    const validatedFields = UpdateUserByAdminFormSchema.safeParse(data); // [cite: 68]
    if (!validatedFields.success) { // [cite: 69]
      return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) }; // [cite: 69]
    } // [cite: 70]
    const { name, email, role, department, password: newPassword } = validatedFields.data; // [cite: 70]
    const updateData: any = { // [cite: 71]
      name, // [cite: 71]
      email, // [cite: 72]
      role: roleStringToPrismaEnumMap[role as ClientUserRole] || // [cite: 71]
      PrismaRole.User, // [cite: 72]
      department: department === "_NO_DEPARTMENT_" ? null : department || null, // [cite: 72]
    }; // [cite: 72]
    if (newPassword && newPassword.trim() !== "") { // [cite: 73]
      updateData.password = await bcrypt.hash(newPassword, 10); // [cite: 73]
    } // [cite: 74]

    if (email) { // [cite: 74]
        const userBeingEdited = await prisma.user.findUnique({ where: { email: email } }); // [cite: 75]
        if (userBeingEdited && email !== userBeingEdited.email) { // [cite: 75]
            const existingUserWithEmail = await prisma.user.findUnique({ where: { email: email } }); // [cite: 76]
            if (existingUserWithEmail && existingUserWithEmail.id !== userId) { // [cite: 76]
                return { success: false, message: "El correo electrónico ya está en uso por otro usuario." // [cite: 76]
                }; // [cite: 77]
            } // [cite: 77]
        } // [cite: 77]
    } // [cite: 77]

    await prisma.user.update({ // [cite: 77]
      where: { id: userId }, // [cite: 78]
      data: updateData, // [cite: 78]
    }); // [cite: 78]
    await logAuditEvent(adminEmail, "Actualización de Usuario por Admin", `Usuario ID: ${userId}, Nuevos Datos: ${JSON.stringify({name:name, email: email, role: role, department: department})}`); // [cite: 78]
    revalidatePath("/admin/users"); // [cite: 78]
    return { success: true, message: "Usuario actualizado." }; // [cite: 79]
  } catch (error) { // [cite: 79]
    console.error("updateUserByAdminServerAction Error:", error); // [cite: 80]
    await logAuditEvent(adminEmail, "Error en Actualización de Usuario por Admin", `Usuario ID: ${userId}, Error: ${error instanceof Error ? error.message : String(error)}`); // [cite: 80]
    return { success: false, message: "Error del servidor al actualizar usuario." }; // [cite: 81]
  } // [cite: 82]
}

export async function deleteUserByAdminServerAction(adminEmail: string, userId: string): Promise<{ success: boolean; // [cite: 82]
  message: string }> { // [cite: 83]
  try {
    const userToDelete = await prisma.user.findUnique({ where: { id: userId }}); // [cite: 83]
    if (!userToDelete) { // [cite: 84]
        return { success: false, message: "Usuario no encontrado para eliminar." // [cite: 84]
        }; // [cite: 85]
    } // [cite: 85]
    if (userToDelete.email === adminEmail) { // [cite: 85]
        return { success: false, message: "Un administrador no puede eliminar su propia cuenta."} // [cite: 85]
    } // [cite: 85]

    // Check for related records before attempting deletion
    const relatedTickets = await prisma.ticket.count({ where: { userId } }); // [cite: 85]
    const relatedComments = await prisma.comment.count({ where: { userId } }); // [cite: 86]
    const relatedApprovalRequests = await prisma.approvalRequest.count({ where: { requesterId: userId } }); // [cite: 87]
    // Add checks for other relations like InventoryItem, CasoDeMantenimiento, etc. // [cite: 88]
    if (relatedTickets > 0 || relatedComments > 0 || relatedApprovalRequests > 0) { // [cite: 88]
      return { success: false, message: "No se puede eliminar el usuario porque tiene registros asociados (tickets, comentarios, solicitudes de aprobación, etc.). Reasigna o elimina esos registros primero." // [cite: 88]
      }; // [cite: 89]
    } // [cite: 89]

    await prisma.user.delete({ where: { id: userId } }); // [cite: 89]

    await logAuditEvent(adminEmail, "Eliminación de Usuario por Admin", `Usuario ID: ${userId}, Email: ${userToDelete.email || 'N/A'}`); // [cite: 90]
    revalidatePath("/admin/users"); // [cite: 90]
    return { success: true, message: "Usuario eliminado." }; // [cite: 91]
  } catch (error: any) { // [cite: 91]
    console.error("deleteUserByAdminServerAction Error:", error); // [cite: 92]
    await logAuditEvent(adminEmail, "Error en Eliminación de Usuario por Admin", `Usuario ID: ${userId}, Error: ${error.message || String(error)}`); // [cite: 92]
    // Prisma's P2025 (Record to delete does not exist) might occur if already deleted. // [cite: 93]
    // Other foreign key errors might be caught by the checks above, but this is a fallback. // [cite: 94]
    if (error.code === 'P2003' || error.code === 'P2014' ) { // [cite: 95]
      return { success: false, message: "No se puede eliminar el usuario porque tiene registros asociados. Reasigna o elimina esos registros primero." // [cite: 95]
      }; // [cite: 96]
    } // [cite: 96]
    return { success: false, message: "Error del servidor al eliminar usuario." }; // [cite: 97]
  } // [cite: 97]
}


// --- Ticket Actions ---
export async function createTicketAction( // [cite: 99]
  userId: string, // [cite: 99]
  userName: string, // [cite: 100]
  values: z.infer<typeof CreateTicketClientSchema> // [cite: 100]
): Promise<{ success: boolean; message: string; // [cite: 100]
  ticketId?: string; errors?: any }> { // [cite: 100]
  try {
    const validatedFields = CreateTicketClientSchema.safeParse(values); // [cite: 100]
    if (!validatedFields.success) { // [cite: 101]
      console.error("createTicketAction Validation Errors:", validatedFields.error.flatten().fieldErrors); // [cite: 101]
      return { // [cite: 102]
        success: false, // [cite: 102]
        errors: validatedFields.error.flatten().fieldErrors, // [cite: 102]
        message: "Fallo al crear ticket debido a errores de validación.", // [cite: 102]
      }; // [cite: 103]
    } // [cite: 103]
    const { subject, description, priority, userEmail } = validatedFields.data; // [cite: 103]
    const newTicket = await prisma.ticket.create({ // [cite: 104]
      data: { // [cite: 104]
        subject, // [cite: 104]
        description, // [cite: 104]
        priority: ticketPriorityStringToPrismaEnumMap[priority], // [cite: 104]
        status: PrismaTicketStatus.Open, // [cite: 104]
        userId, // [cite: 104]
        userName, // [cite: 104]
        userEmail, // [cite: 104]
      } // [cite: 104]
    }); // [cite: 105]
    await logAuditEvent(userEmail, "Creación de Ticket", `Ticket Asunto: ${subject}, ID: ${newTicket.id}`); // [cite: 105]
    await sendNtfyNotification({ // [cite: 106]
      title: `Nuevo Ticket: ${subject.substring(0, 30)}...`, // [cite: 106]
      message: `Ticket #${newTicket.id} (${subject}) creado por ${userName}. Prioridad: ${priority}.`, // [cite: 106]
      priority: priority === 'High' ? 5 : (priority === 'Medium' ? 3 : 1), // [cite: 106]
      tags: ['ticket', 'nuevo', priority.toLowerCase()], // [cite: 106]
    }); // [cite: 107]
    revalidatePath("/tickets"); // [cite: 107]
    revalidatePath(`/tickets/${newTicket.id}`); // [cite: 107]
    revalidatePath("/dashboard"); // [cite: 107]
    revalidatePath("/admin/analytics"); // [cite: 107]
    revalidatePath("/admin/reports"); // [cite: 107]


    return { // [cite: 107]
      success: true, // [cite: 108]
      message: "¡Ticket creado exitosamente!", // [cite: 108]
      ticketId: newTicket.id, // [cite: 108]
    }; // [cite: 108]
  } catch (error: any) { // [cite: 108]
    console.error("createTicketAction Error:", error); // [cite: 109]
    const emailForLog = values.userEmail || 'unknown_user_ticket_creation'; // [cite: 109]
    await logAuditEvent(emailForLog, "Error en Creación de Ticket", `Error: ${error.message || String(error)}`); // [cite: 109]
    return { // [cite: 110]
      success: false, // [cite: 110]
      message: "Error de base de datos al crear el ticket: " + (error.message || "Error desconocido."), // [cite: 110]
    }; // [cite: 111]
  } // [cite: 111]
}

export async function addCommentAction( // [cite: 111]
  ticketId: string, // [cite: 112]
  commenter: Pick<ClientUserType, 'id' | 'name' | 'email' | 'avatarUrl'>, // [cite: 112]
  values: z.infer<typeof AddCommentClientSchema> // [cite: 112]
): Promise<{ success: boolean; // [cite: 112]
  message: string; commentId?: string, errors?: any }> { // [cite: 112]
  try {
    const validatedFields = AddCommentClientSchema.safeParse(values); // [cite: 113]
    if (!validatedFields.success) { // [cite: 113]
      console.error("addCommentAction Validation Errors:", validatedFields.error.flatten().fieldErrors); // [cite: 114]
      return { // [cite: 114]
        success: false, // [cite: 114]
        errors: validatedFields.error.flatten().fieldErrors, // [cite: 114]
        message: "Fallo al añadir comentario debido a errores de validación.", // [cite: 114]
      }; // [cite: 115]
    } // [cite: 115]

    if (!commenter.id || !commenter.email || !commenter.name) { // [cite: 115]
      console.error("addCommentAction: Commenter info incomplete", commenter); // [cite: 116]
      return { success: false, message: "Información del comentador incompleta." }; // [cite: 117]
    } // [cite: 117]

    const newComment = await prisma.comment.create({ // [cite: 117]
      data: { // [cite: 118]
        text: validatedFields.data.text, // [cite: 118]
        ticketId, // [cite: 118]
        userId: commenter.id, // [cite: 118]
        userName: commenter.name, // [cite: 118]
        userAvatarUrl: commenter.avatarUrl || null, // [cite: 118]
      } // [cite: 118]
    }); // [cite: 118]
    await prisma.ticket.update({ // [cite: 118]
      where: { id: ticketId }, // [cite: 119]
      data: { updatedAt: new Date() } // [cite: 119]
    }); // [cite: 119]
    await logAuditEvent(commenter.email, "Adición de Comentario", `Ticket ID: ${ticketId}, Usuario: ${commenter.name}`); // [cite: 119]
    await sendNtfyNotification({ // [cite: 120]
      title: `Nuevo Comentario en Ticket #${ticketId}`, // [cite: 120]
      message: `${commenter.name} comentó: "${validatedFields.data.text.substring(0,50)}..."`, // [cite: 120]
      tags: ['ticket', 'comentario', ticketId], // [cite: 120]
    }); // [cite: 121]
    revalidatePath(`/tickets/${ticketId}`); // [cite: 121]
    revalidatePath("/tickets"); // [cite: 121]
    revalidatePath("/dashboard"); // [cite: 121]

    return { // [cite: 121]
      success: true, // [cite: 122]
      message: "¡Comentario añadido exitosamente!", // [cite: 122]
      commentId: newComment.id, // [cite: 122]
    }; // [cite: 122]
  } catch (error: any) { // [cite: 122]
    console.error("addCommentAction Error:", error); // [cite: 123]
    const emailForLog = commenter.email || 'unknown_user_comment_creation'; // [cite: 123]
    await logAuditEvent(emailForLog, "Error en Adición de Comentario", `Ticket ID: ${ticketId}, Error: ${error.message || String(error)}`); // [cite: 123]
    return { // [cite: 124]
      success: false, // [cite: 124]
      message: "Error de base de datos al añadir comentario: " + (error.message || "Error desconocido."), // [cite: 124]
    }; // [cite: 125]
  } // [cite: 125]
}

export async function updateTicketStatusAction( // [cite: 125]
  ticketId: string, // [cite: 126]
  values: z.infer<typeof UpdateTicketStatusClientSchema> // [cite: 126]
): Promise<{ success: boolean; message: string; // [cite: 126]
  errors?: any }> { // [cite: 126]
  try {
    const validatedFields = UpdateTicketStatusClientSchema.safeParse(values); // [cite: 127]

    if (!validatedFields.success) { // [cite: 127]
      console.error("updateTicketStatusAction Validation Errors:", validatedFields.error.flatten().fieldErrors); // [cite: 128]
      return { // [cite: 128]
        success: false, // [cite: 128]
        errors: validatedFields.error.flatten().fieldErrors, // [cite: 128]
        message: "Fallo al actualizar estado debido a errores de validación.", // [cite: 128]
      }; // [cite: 129]
    } // [cite: 129]
    const { status, actingUserEmail } = validatedFields.data; // [cite: 129]

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } }); // [cite: 130]
    if (!ticket) { // [cite: 131]
      console.error(`updateTicketStatusAction: Ticket with ID ${ticketId} not found.`); // [cite: 131]
      return { success: false, message: "Ticket no encontrado." }; // [cite: 132]
    } // [cite: 132]
    const oldStatus = ticket.status; // [cite: 132]

    await prisma.ticket.update({ // [cite: 133]
      where: { id: ticketId }, // [cite: 133]
      data: { status: ticketStatusStringToPrismaEnumMap[status], updatedAt: new Date() } // [cite: 133]
    }); // [cite: 134]

    await logAuditEvent(actingUserEmail, "Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, De: ${oldStatus}, A: ${status}`); // [cite: 134]
    await sendNtfyNotification({ // [cite: 135]
      title: `Ticket #${ticketId} Actualizado`, // [cite: 135]
      message: `El estado del ticket "${ticket.subject}" cambió de ${oldStatus} a ${status}.`, // [cite: 135]
      tags: ['ticket', 'actualizacion-estado', ticketId, status.toLowerCase().replace(' ', '-')], // [cite: 135]
    }); // [cite: 136]

    revalidatePath(`/tickets/${ticketId}`); // [cite: 136]
    revalidatePath("/tickets"); // [cite: 136]
    revalidatePath("/dashboard"); // [cite: 136]
    revalidatePath("/admin/analytics"); // [cite: 136]
    revalidatePath("/admin/reports"); // [cite: 136]


    const statusDisplayMap: Record<string, string> = TICKET_STATUSES_ENGLISH.reduce((acc, s, index) => { // [cite: 136]
      acc[s] = TICKET_STATUSES[index]; // Map English to Spanish // [cite: 136]
      return acc; // [cite: 136]
    }, {} as Record<string, string>); // [cite: 136]


    return { success: true, message: `Estado del ticket actualizado a ${statusDisplayMap[status] || status}.` }; // [cite: 137]
  } catch (error: any) { // [cite: 138]
    console.error("updateTicketStatusAction Error:", error); // [cite: 138]
    const emailForLog = values.actingUserEmail || 'unknown_user_status_update'; // [cite: 138]
    await logAuditEvent(emailForLog, "Error en Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, Error: ${error.message || String(error)}`); // [cite: 139]
    return { success: false, message: "Error de base de datos al actualizar estado: " + (error.message || "Error desconocido.") }; // [cite: 140]
  } // [cite: 141]
}

export async function getTicketById(ticketId: string) { // [cite: 141]
  try {
    const ticket = await prisma.ticket.findUnique({ // [cite: 141]
      where: { id: ticketId }, // [cite: 142]
      include: { // [cite: 142]
        comments: { orderBy: { createdAt: 'asc' }}, // [cite: 142]
        attachments: true, // [cite: 142]
        user: { select: { name: true, email: true }} // [cite: 142]
      } // [cite: 142]
    }); // [cite: 142]
    return ticket; // [cite: 142]
  } catch (error) { // [cite: 142]
    console.error(`getTicketById Error for ticket ID ${ticketId}:`, error); // [cite: 143]
    return null; // [cite: 143]
  } // [cite: 143]
}

export async function getAllTickets() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        user: { select: { name: true }},
        // CORRECCIÓN CLAVE: Incluir todas las propiedades requeridas por la interfaz Comment
        comments: { 
          select: { 
            id: true,
            text: true,
            userId: true,
            userName: true,
            userAvatarUrl: true, // Si existe en tu modelo Comment
            createdAt: true,
            ticketId: true,
          },
          orderBy: { createdAt: 'asc' as const } // Aseguramos el tipo para orderBy
        },
        attachments: { select: { id: true, fileName: true, url: true, size: true, type: true }} 
      },
      orderBy: [
        { priority: 'desc' as const }, // Aseguramos el tipo para orderBy
        { createdAt: 'desc' as const } // Aseguramos el tipo para orderBy
      ]
    });
    return tickets;
  } catch (error) {
    console.error("getAllTickets Error:", error);
    return [];
  }
}

export async function getDashboardStats() { // [cite: 146]
  try {
    const total = await prisma.ticket.count(); // [cite: 147]
    const open = await prisma.ticket.count({ where: { status: PrismaTicketStatus.Open } }); // [cite: 147]
    const inProgress = await prisma.ticket.count({ where: { status: PrismaTicketStatus.InProgress } }); // [cite: 148]
    const resolved = await prisma.ticket.count({ where: { status: PrismaTicketStatus.Resolved } }); // [cite: 149]
    const closed = await prisma.ticket.count({ where: { status: PrismaTicketStatus.Closed } }); // [cite: 150]
    const summary = { total, open, inProgress, resolved, closed }; // [cite: 151]
    const byPriorityDb = await prisma.ticket.groupBy({ // [cite: 152]
      by: ['priority'], // [cite: 152]
      _count: { id: true }, // [cite: 152]
    }); // [cite: 153]
    const byStatusDb = await prisma.ticket.groupBy({ // [cite: 153]
      by: ['status'], // [cite: 153]
      _count: { id: true }, // [cite: 153]
    }); // [cite: 154]
    const priorityMapClient: Record<ClientTicketPriority, number> = { High: 0, Medium: 0, Low: 0 }; // [cite: 154]
    byPriorityDb.forEach(p => { priorityMapClient[p.priority as ClientTicketPriority] = p._count.id; }); // [cite: 155]

    const statusMapClient: Record<ClientTicketStatus, number> = { Open: 0, "InProgress": 0, Resolved: 0, Closed: 0 }; // [cite: 155]
    byStatusDb.forEach(s => { statusMapClient[s.status as ClientTicketStatus] = s._count.id; }); // [cite: 156]


    const stats = { // [cite: 156]
      byPriority: TICKET_PRIORITIES_ENGLISH.map(pKey => ({ // [cite: 157]
        name: pKey, // [cite: 157]
        value: priorityMapClient[pKey], // [cite: 157]
      })), // [cite: 157]
      byStatus: TICKET_STATUSES_ENGLISH.map(sKey => ({ // [cite: 157]
        name: sKey, // [cite: 157]
        value: statusMapClient[sKey], // [cite: 157]
      })), // [cite: 157]
    }; // [cite: 157]
    return { summary, stats }; // [cite: 158]
  } catch (error) { // [cite: 158]
    console.error("getDashboardStats Error:", error); // [cite: 158]
    const placeholderSummary = { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }; // [cite: 158]
    const placeholderStats = { // [cite: 159]
      byPriority: TICKET_PRIORITIES_ENGLISH.map(pKey => ({ name: pKey as string, value: 0 })), // [cite: 159]
      byStatus: TICKET_STATUSES_ENGLISH.map(sKey => ({ name: sKey as string, value: 0 })) // [cite: 159]
    }; // [cite: 160]
    return { summary: placeholderSummary, stats: placeholderStats }; // [cite: 160]
  } // [cite: 160]
}

// --- Inventory Actions ---
const storageTypeStringToPrismaEnumMap: Record<ClientStorageType, PrismaStorageType> = {
  "HDD": PrismaStorageType.HDD,
  "SSD": PrismaStorageType.SSD,
  "NoEspecificado": PrismaStorageType.NoEspecificado,
};

// CORRECCIÓN CLAVE AQUÍ: ramStringToPrismaEnumMap ahora usa los nombres internos del enum de Prisma como claves
const ramStringToPrismaEnumMap: Record<ClientRamOptionType, PrismaRamOption> = {
  "NoEspecificado": PrismaRamOption.NoEspecificado,
  "RAM_2GB": PrismaRamOption.RAM_2GB, // Clave: nombre del enum de Prisma
  "RAM_4GB": PrismaRamOption.RAM_4GB,
  "RAM_8GB": PrismaRamOption.RAM_8GB,
  "RAM_12GB": PrismaRamOption.RAM_12GB,
  "RAM_16GB": PrismaRamOption.RAM_16GB,
  "RAM_32GB": PrismaRamOption.RAM_32GB,
  "RAM_64GB": PrismaRamOption.RAM_64GB,
  "Otro": PrismaRamOption.Otro,
};

const categoryStringToPrismaEnumMap: Record<ClientInventoryItemCategory, PrismaInventoryItemCategory> = {
  "Computadora": PrismaInventoryItemCategory.Computadora,
  "Monitor": PrismaInventoryItemCategory.Monitor,
  "Teclado": PrismaInventoryItemCategory.Teclado,
  "Mouse": PrismaInventoryItemCategory.Mouse,
  "Impresora": PrismaInventoryItemCategory.Impresora,
  "Escaner": PrismaInventoryItemCategory.Escaner,
  "Router": PrismaInventoryItemCategory.Router,
  "Switch": PrismaInventoryItemCategory.Switch,
  "Servidor": PrismaInventoryItemCategory.Servidor,
  "Laptop": PrismaInventoryItemCategory.Laptop,
  "Tablet": PrismaInventoryItemCategory.Tablet,
  "Proyector": PrismaInventoryItemCategory.Proyector,
  "TelefonoIP": PrismaInventoryItemCategory.TelefonoIP,
  "OtroPeriferico": PrismaInventoryItemCategory.OtroPeriferico,
  "Software": PrismaInventoryItemCategory.Software,
  "Licencia": PrismaInventoryItemCategory.Licencia,
  "Otro": PrismaInventoryItemCategory.Otro
};

const statusStringToPrismaEnumMap: Record<ClientInventoryItemStatus, PrismaInventoryItemStatus> = {
  "EnUso": PrismaInventoryItemStatus.EnUso,
  "EnAlmacen": PrismaInventoryItemStatus.EnAlmacen,
  "EnReparacion": PrismaInventoryItemStatus.EnReparacion,
  "DeBaja": PrismaInventoryItemStatus.DeBaja,
  "Perdido": PrismaInventoryItemStatus.Perdido,
};
export async function getAllInventoryItems() { // [cite: 164]
  try {
    const items = await prisma.inventoryItem.findMany({ // [cite: 164]
      orderBy: { createdAt: 'desc' }, // [cite: 165]
      include: { addedByUser: { select: { name: true }}} // [cite: 165]
    }); // [cite: 165]
    return items; // [cite: 165]
  } catch (error) { // [cite: 165]
    console.error("getAllInventoryItems Error:", error); // [cite: 166]
    return []; // [cite: 166]
  } // [cite: 166]
}

export async function addInventoryItemAction( // [cite: 166]
  currentUser: Pick<ClientUserType, 'id' | 'name' | 'email'>, // [cite: 167]
  values: z.infer<typeof BaseInventoryItemSchema> // [cite: 167]
): Promise<{ success: boolean; // [cite: 167]
  message: string; itemId?: string, errors?: any }> { // [cite: 167]
  try {
    if (!currentUser || !currentUser.id || !currentUser.name || !currentUser.email) { // [cite: 167]
      return { success: false, message: "Información del usuario actual incompleta o inválida." // [cite: 168]
      }; // [cite: 168]
    } // [cite: 168]
    const validatedFields = BaseInventoryItemSchema.safeParse(values); // [cite: 168]
    if (!validatedFields.success) { // [cite: 168]
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al añadir artículo: Errores de validación." // [cite: 169]
      }; // [cite: 169]
    } // [cite: 169]
    const data = validatedFields.data; // [cite: 169]

    const dataToCreate = { // [cite: 169]
      name: data.name, // [cite: 170]
      category: categoryStringToPrismaEnumMap[data.category], // [cite: 170]
      brand: data.brand || // [cite: 170]
      null, // [cite: 170]
      model: data.model || null, // [cite: 170]
      serialNumber: data.serialNumber || // [cite: 171]
      null, // [cite: 171]
      processor: data.processor || null, // [cite: 171]
      ram: (data.ram && data.ram !== "NoEspecificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOptionType] : PrismaRamOption.NoEspecificado) || // [cite: 171]
      null, // [cite: 172]
      storageType: (data.storageType && data.storageType !== "NoEspecificado" ? storageTypeStringToPrismaEnumMap[data.storageType as ClientStorageType] : PrismaStorageType.NoEspecificado) || // [cite: 172]
      null, // [cite: 173]
      storage: data.storage || null, // [cite: 173]
      quantity: data.quantity, // [cite: 174]
      location: data.location || // [cite: 174]
      null, // [cite: 174]
      status: statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus], // [cite: 174]
      notes: data.notes || // [cite: 175]
      null, // [cite: 175]
      addedByUserId: currentUser.id, // [cite: 175]
      addedByUserName: currentUser.name, // [cite: 175]
    }; // [cite: 176]
    const newItem = await prisma.inventoryItem.create({ // [cite: 176]
      data: dataToCreate, // [cite: 176]
    }); // [cite: 177]
    await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo Nombre: ${data.name}, ID: ${newItem.id}`); // [cite: 177]
    revalidatePath("/inventory"); // [cite: 177]
    return { success: true, message: `Artículo "${data.name}" (ID: ${newItem.id}) añadido exitosamente.`, itemId: newItem.id }; // [cite: 178]
  } catch (error: any) { // [cite: 179]
    console.error("addInventoryItemAction Error:", error); // [cite: 179]
    const userEmailForLog = currentUser?.email || 'unknown_user_for_add_item'; // [cite: 179]
    await logAuditEvent(userEmailForLog, "Error en Adición de Artículo de Inventario", `Error: ${error.message || String(error)}`); // [cite: 180]
    if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) { // [cite: 181]
      return { success: false, message: "Error: El número de serie ya existe en el inventario." // [cite: 181]
      }; // [cite: 182]
    } // [cite: 182]
    return { success: false, message: `Error de base de datos al añadir artículo: ${error.message || // [cite: 182]
    "Error desconocido"}` }; // [cite: 183]
  } // [cite: 183]
}

export async function updateInventoryItemAction( // [cite: 183]
  itemId: string, // [cite: 184]
  actingUserEmail: string, // [cite: 184]
  values: z.infer<typeof BaseInventoryItemSchema> // [cite: 184]
): Promise<{ success: boolean; // [cite: 184]
  message: string; itemId?: string, errors?: any }> { // [cite: 184]
  try {
    const validatedFields = BaseInventoryItemSchema.safeParse(values); // [cite: 185]
    if (!validatedFields.success) { // [cite: 185]
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al actualizar artículo: Errores de validación." // [cite: 186]
      }; // [cite: 186]
    } // [cite: 186]
    const data = validatedFields.data; // [cite: 186]

    const itemToUpdate = await prisma.inventoryItem.findUnique({ where: { id: itemId } }); // [cite: 187]
    if (!itemToUpdate) return { success: false, message: "Artículo no encontrado." }; // [cite: 188]
    const dataToUpdate: any = { // [cite: 188]
        name: data.name, // [cite: 188]
        category: categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory], // [cite: 189]
        brand: data.brand || // [cite: 189]
        null, // [cite: 189]
        model: data.model || // [cite: 190]
        null, // [cite: 190]
        serialNumber: data.serialNumber || // [cite: 191]
        null, // [cite: 191]
        processor: data.processor || // [cite: 192]
        null, // [cite: 192]
        ram: (data.ram && data.ram !== "NoEspecificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOptionType] : PrismaRamOption.NoEspecificado) || // [cite: 192]
        null, // [cite: 193]
        storageType: (data.storageType && data.storageType !== "NoEspecificado" ? storageTypeStringToPrismaEnumMap[data.storageType as ClientStorageType] : PrismaStorageType.NoEspecificado) || // [cite: 193]
        null, // [cite: 194]
        storage: data.storage || // [cite: 195]
        null, // [cite: 195]
        quantity: data.quantity, // [cite: 195]
        location: data.location || // [cite: 196]
        null, // [cite: 196]
        status: statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus], // [cite: 196]
        notes: data.notes || // [cite: 197]
        null, // [cite: 197]
        updatedAt: new Date() // [cite: 197]
      }; // [cite: 198]
    const updatedItem = await prisma.inventoryItem.update({ // [cite: 198]
      where: { id: itemId }, // [cite: 199]
      data: dataToUpdate // [cite: 199]
    }); // [cite: 199]
    await logAuditEvent(actingUserEmail, "Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${data.name}`); // [cite: 199]
    revalidatePath("/inventory"); // [cite: 200]
    return { success: true, message: `Artículo "${data.name}" actualizado exitosamente.`, itemId: updatedItem.id }; // [cite: 201]
  } catch (error: any) { // [cite: 201]
    console.error("updateInventoryItemAction Error:", error); // [cite: 202]
    await logAuditEvent(actingUserEmail, "Error en Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Error: ${error.message || String(error)}`); // [cite: 202]
    if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) { // [cite: 203]
      return { success: false, message: "Error: El número de serie ya existe en el inventario para otro artículo." // [cite: 203]
      }; // [cite: 204]
    } // [cite: 204]
    return { success: false, message: `Error de base de datos al actualizar artículo: ${error.message || // [cite: 204]
    "Error desconocido"}` }; // [cite: 205]
  } // [cite: 205]
}

export async function deleteInventoryItemAction(itemId: string, actingUserEmail: string): Promise<{ success: boolean; // [cite: 205]
  message: string }> { // [cite: 206]
  try {
    const itemToDelete = await prisma.inventoryItem.findUnique({ where: { id: itemId } }); // [cite: 206]
    if (!itemToDelete) return { success: false, message: "Artículo no encontrado para eliminar." }; // [cite: 207]
    await prisma.inventoryItem.delete({ where: { id: itemId } }); // [cite: 208]

    await logAuditEvent(actingUserEmail, "Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${itemToDelete.name}`); // [cite: 208]
    revalidatePath("/inventory"); // [cite: 209]
    return { success: true, message: "Artículo eliminado exitosamente." }; // [cite: 210]
  } catch (error: any) { // [cite: 210]
    console.error("deleteInventoryItemAction Error:", error); // [cite: 211]
    await logAuditEvent(actingUserEmail, "Error en Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Error: ${error.message || String(error)}`); // [cite: 211]
    return { success: false, message: `Error de base de datos al eliminar artículo: ${error.message || "Error desconocido"}.` }; // [cite: 212]
  } // [cite: 213]
}

const excelToInternalFieldMap: Record<string, keyof z.infer<typeof BaseInventoryItemSchema>> = { // [cite: 213]
  'nombre': 'name', 'nombre del articulo': 'name', 'nombre del artículo': 'name', 'articulo': 'name', 'artículo': 'name', 'equipo': 'name', // [cite: 213]
  'categoría': 'category', 'categoria': 'category', // [cite: 214]
  'marca': 'brand', // [cite: 214]
  'modelo': 'model', // [cite: 214]
  'número de serie': 'serialNumber', 'numero de serie': 'serialNumber', 'n/s': 'serialNumber', 'serial': 'serialNumber', 'serie': 'serialNumber', // [cite: 214]
  'procesador': 'processor', // [cite: 214]
  'ram': 'ram', 'memoria ram': 'ram', // [cite: 214]
  'tipo de almacenamiento': 'storageType', 'tipo de disco': 'storageType', // [cite: 214]
  'capacidad de almacenamiento': 'storage', 'almacenamiento': 'storage', // [cite: 214]
  'cantidad': 'quantity', 'cant': 'quantity', // [cite: 214]
  'ubicación': 'location', 'ubicacion': 'location', 'departamento': 'location', 'asignacion': 'location', 'asignación': 'location', // [cite: 214]
  'estado': 'status', // [cite: 214]
  'notas adicionales': 'notes', 'notas': // [cite: 214]
  'notes', 'observaciones': 'notes', // [cite: 214]
}; // [cite: 214]

const mapExcelRowToInventoryItemFormValues = (row: ExcelInventoryItemData): Partial<z.infer<typeof BaseInventoryItemSchema>> => { // [cite: 214]
  const mapped: Partial<z.infer<typeof BaseInventoryItemSchema>> = {}; // [cite: 215]
  for (const excelHeader in row) { // [cite: 215]
    const lowerExcelHeader = excelHeader.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // [cite: 216]
    const internalField = excelToInternalFieldMap[lowerExcelHeader] as keyof z.infer<typeof BaseInventoryItemSchema>; // [cite: 216]
    if (internalField) { // [cite: 216]
      let value: any = row[excelHeader]; // [cite: 217]
      if (value === null || value === undefined || String(value).trim() === "") { // [cite: 217]
        mapped[internalField] = undefined; // [cite: 218]
        continue; // [cite: 218]
      } // [cite: 218]

      if (internalField === 'quantity') { // [cite: 218]
        const parsedQuantity = parseInt(String(value), 10); // [cite: 219]
        mapped[internalField] = isNaN(parsedQuantity) ? undefined : parsedQuantity; // [cite: 219]
      } else if (internalField === 'category') { // [cite: 219]
        const normalizedValue = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ""); // [cite: 220]
        const foundValue = INVENTORY_ITEM_CATEGORIES.find(opt => opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "") === normalizedValue); // [cite: 220]
        mapped[internalField] = foundValue || undefined; // [cite: 221]
      } else if (internalField === 'status') { // [cite: 221]
         const normalizedValue = String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ""); // [cite: 222]
         const foundValue = INVENTORY_ITEM_STATUSES.find(opt => opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "") === normalizedValue); // [cite: 222]
        mapped[internalField] = foundValue || undefined; // [cite: 223]
      } else if (internalField === 'ram') { // [cite: 223]
        const normalizedValue = String(value).trim().toUpperCase().replace(/\s+/g,"").replace('GB',''); // [cite: 223]
        const foundRamValue = ClientRamOptions.find(opt => opt.toUpperCase().replace(/\s+/g,"").replace('GB','') === normalizedValue); // [cite: 224]
        mapped[internalField] = foundRamValue || "No Especificado" as ClientRamOptionType; // [cite: 224]
      } else if (internalField === 'storageType') { // [cite: 225]
        const normalizedValue = String(value).trim().toUpperCase().replace(/\s+/g,""); // [cite: 225]
        // Match "No Especificado" from Excel too // [cite: 226]
        if (normalizedValue === "NOESPECIFICADO") { // [cite: 226]
             mapped[internalField] = "No Especificado" as ClientStorageType; // [cite: 227]
        } else { // [cite: 227]
            const foundStorageType = STORAGE_TYPES_ZOD_ENUM.filter(st => st !== "NoEspecificado").find(opt => opt.toUpperCase().replace(/\s+/g,"") === normalizedValue); // [cite: 227]
            mapped[internalField] = foundStorageType || undefined; // [cite: 228]
        } // [cite: 228]
      } // [cite: 228]
      else { // [cite: 228]
         mapped[internalField] = String(value).trim(); // [cite: 229]
      } // [cite: 229]
    } // [cite: 229]
  } // [cite: 229]
  if (mapped.quantity === undefined || isNaN(Number(mapped.quantity))) mapped.quantity = 1; // [cite: 230]
  if (mapped.status === undefined) mapped.status = "En Uso" as ClientInventoryItemStatus; // [cite: 230]
  if (mapped.category === undefined) mapped.category = "Otro" as ClientInventoryItemCategory; // [cite: 231]
  return mapped; // [cite: 231]
}; // [cite: 231]

export async function importInventoryItemsAction( // [cite: 231]
  itemDataArray: ExcelInventoryItemData[], // [cite: 232]
  currentUserEmail: string, // [cite: 232]
  currentUserId: string, // [cite: 232]
  currentUserName: string // [cite: 232]
): Promise<{ success: boolean; // [cite: 232]
  message: string; successCount: number; errorCount: number; errors: { row: number; message: string; data: ExcelInventoryItemData }[]; // [cite: 233]
}> { // [cite: 233]
  let successCount = 0; // [cite: 233]
  let errorCount = 0; // [cite: 234]
  const errors: { row: number; message: string; // [cite: 234]
  data: ExcelInventoryItemData }[] = []; // [cite: 234]

  if (!itemDataArray || itemDataArray.length === 0) { // [cite: 235]
    return { success: false, message: "No se proporcionaron datos para importar o el archivo está vacío.", successCount: 0, errorCount: itemDataArray?.length || // [cite: 235]
    0, errors: [{ row: 0, message: "Archivo vacío o sin datos.", data: {} }] }; // [cite: 236]
  } // [cite: 236]

  try { // [cite: 236]
    for (let i = 0; i < itemDataArray.length; i++) { // [cite: 236]
      const rawRow = itemDataArray[i]; // [cite: 237]
      let mappedData: Partial<z.infer<typeof BaseInventoryItemSchema>> = {}; // [cite: 237]
      try { // [cite: 237]
        mappedData = mapExcelRowToInventoryItemFormValues(rawRow); // [cite: 238]
        const validatedFields = BaseInventoryItemSchema.safeParse(mappedData); // [cite: 238]

        if (!validatedFields.success) { // [cite: 239]
          errorCount++; // [cite: 239]
          const fieldErrors = validatedFields.error.flatten().fieldErrors as Record<string, string[] | undefined>; // [cite: 239]
          let errorMessage = Object.entries(fieldErrors) // [cite: 240]
            .map(([field, messages]) => `${field}: ${(messages || ['Error desconocido']).join(', ')}`) // [cite: 240]
            .join('; ') || // [cite: 240]
          "Error desconocido en validación."; // [cite: 240]
          errors.push({ row: i + 2, message: `Error de validación: ${errorMessage}`, data: rawRow }); // [cite: 240]
          continue; // [cite: 241]
        } // [cite: 241]

        const data = validatedFields.data; // [cite: 241]
        if (!categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory]) { // [cite: 242]
             errorCount++; // [cite: 243]
             errors.push({ row: i + 2, message: `Error de mapeo: Categoría inválida '${data.category}' no encontrada en el sistema. Valores válidos: ${Object.keys(categoryStringToPrismaEnumMap).join(', ')}`, data: rawRow }); // [cite: 243]
          continue; // [cite: 244]
        } // [cite: 244]
        if (!statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus]) { // [cite: 244]
             errorCount++; // [cite: 245]
             errors.push({ row: i + 2, message: `Error de mapeo: Estado inválido '${data.status}' no encontrado en el sistema. Valores válidos: ${Object.keys(statusStringToPrismaEnumMap).join(', ')}`, data: rawRow }); // [cite: 245]
          continue; // [cite: 246]
        } // [cite: 246]
        const mappedRam = (data.ram && data.ram !== "NoEspecificado" ? ramStringToPrismaEnumMap[data.ram as ClientRamOptionType] : PrismaRamOption.NoEspecificado) || // [cite: 246]
        null; // [cite: 247]
        const mappedStorageType = (data.storageType && data.storageType !== "NoEspecificado" ? storageTypeStringToPrismaEnumMap[data.storageType as ClientStorageType] : PrismaStorageType.NoEspecificado) || null; // [cite: 247]
        if (data.ram && data.ram !== "NoEspecificado" && !mappedRam) { // [cite: 248]
            errorCount++; // [cite: 248]
            errors.push({ row: i + 2, message: `Error de mapeo: RAM inválida '${data.ram}' no encontrada en el sistema. Valores válidos: ${Object.keys(ramStringToPrismaEnumMap).join(', ')}`, data: rawRow }); // [cite: 249]
          continue; // [cite: 250]
        } // [cite: 250]
         if (data.storageType && data.storageType !== "NoEspecificado" && !mappedStorageType) { // [cite: 250]
            errorCount++; // [cite: 251]
            errors.push({ row: i + 2, message: `Error de mapeo: Tipo de Almacenamiento inválido '${data.storageType}'. Valores válidos: ${Object.keys(storageTypeStringToPrismaEnumMap).filter(k => k !== "No Especificado").join(', ')}`, data: rawRow }); // [cite: 251]
          continue; // [cite: 252]
        } // [cite: 252]


        const dataToCreate = { // [cite: 252]
            name: data.name, // [cite: 253]
            category: categoryStringToPrismaEnumMap[data.category as ClientInventoryItemCategory], // [cite: 253]
            brand: data.brand || // [cite: 253]
            null, // [cite: 253]
            model: data.model || // [cite: 254]
            null, // [cite: 254]
            serialNumber: data.serialNumber || // [cite: 255]
            null, // [cite: 255]
            processor: data.processor || // [cite: 256]
            null, // [cite: 256]
            ram: mappedRam, // [cite: 256]
            storageType: mappedStorageType, // [cite: 256]
            storage: data.storage || // [cite: 257]
            null, // [cite: 257]
            quantity: data.quantity, // [cite: 257]
            location: data.location || // [cite: 258]
            null, // [cite: 258]
            status: statusStringToPrismaEnumMap[data.status as ClientInventoryItemStatus], // [cite: 258]
            notes: data.notes || // [cite: 259]
            null, // [cite: 259]
            addedByUserId: currentUserId, // [cite: 259]
            addedByUserName: currentUserName, // [cite: 259]
        }; // [cite: 260]
        await prisma.inventoryItem.create({ data: dataToCreate }); // [cite: 260]
        successCount++; // [cite: 260]
      } catch (e: any) { // [cite: 261]
        errorCount++; // [cite: 261]
        if (e.code === 'P2002' && e.meta?.target?.includes('serialNumber')) { // [cite: 261]
             errors.push({ row: i + 2, message: `Error: Número de serie '${mappedData.serialNumber || 'N/A'}' ya existe.`, data: rawRow }); // [cite: 262]
        } else { // [cite: 262]
            errors.push({ row: i + 2, message: `Error procesando fila: ${e.message || String(e)}`, data: rawRow }); // [cite: 263]
        } // [cite: 263]
      } // [cite: 263]
    } // [cite: 263]

    if (successCount > 0) { // [cite: 264]
      await logAuditEvent(currentUserEmail, "Importación Masiva de Inventario", `Se importaron ${successCount} artículos. Errores: ${errorCount}.`); // [cite: 264]
    } else if (errorCount > 0 && itemDataArray.length > 0) { // [cite: 264]
      await logAuditEvent(currentUserEmail, "Intento Fallido de Importación Masiva de Inventario", `No se importaron artículos. Errores: ${errorCount} de ${itemDataArray.length} filas.`); // [cite: 265]
    } // [cite: 265]

    revalidatePath("/inventory"); // [cite: 265]
    return { // [cite: 266]
      success: successCount > 0 && errorCount === 0, // [cite: 266]
      message: `Importación completada. // [cite: 266]
${successCount} artículos importados. ${errorCount > 0 ? `${errorCount} filas con errores.` : ''}`, // [cite: 266]
      successCount, // [cite: 266]
      errorCount, // [cite: 266]
      errors, // [cite: 267]
    }; // [cite: 267]
  } catch (globalError: any) { // [cite: 267]
    console.error("Error global durante la importación de inventario:", globalError); // [cite: 268]
    await logAuditEvent(currentUserEmail, "Error Crítico en Importación Masiva de Inventario", globalError.message || "Error desconocido"); // [cite: 268]
    return { // [cite: 269]
      success: false, // [cite: 269]
      message: `Error general durante la importación: ${globalError.message || // [cite: 269]
    "Error desconocido."}`, // [cite: 270]
      successCount, // [cite: 270]
      errorCount: itemDataArray.length - successCount, // [cite: 270]
      errors: itemDataArray.map((row, index) => ({ row: index + 2, message: "Error global durante la importación.", data: row})), // [cite: 271]
    }; // [cite: 271]
  } // [cite: 271]
}


// --- Approval Actions ---

const approvalRequestTypeStringToPrismaEnumMap: Record<ClientApprovalRequestType, PrismaApprovalRequestType> = {
  "Compra": PrismaApprovalRequestType.Compra,
  "PagoProveedor": PrismaApprovalRequestType.PagoProveedor,
};

const approvalStatusStringToPrismaEnumMap: Record<ApprovalStatus, PrismaApprovalStatus> = {
  "Pendiente": PrismaApprovalStatus.Pendiente,
  "Aprobado": PrismaApprovalStatus.Aprobado,
  "Rechazado": PrismaApprovalStatus.Rechazado,
  "InformacionSolicitada": PrismaApprovalStatus.InformacionSolicitada,
};

const paymentTypeStringToPrismaEnumMap: Record<ClientPaymentType, PrismaPaymentType> = {
  "Contado": PrismaPaymentType.Contado,
  "Cuotas": PrismaPaymentType.Cuotas,
};

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

    // Buscar al usuario con el rol de Presidente para asignarlo como aprobador inicial
    const presidente = await prisma.user.findFirst({ where: { role: "Presidente" } });
    if (!presidente) {
      return { success: false, message: "No se encontró un usuario con el rol de Presidente para asignar la aprobación." };
    }

    const newApproval = await prisma.approvalRequest.create({
      data: {
        type: approvalRequestTypeStringToPrismaEnumMap[data.type],
        subject: data.subject,
        description: data.description || null,
        status: PrismaApprovalStatus.Pendiente,
        
        // El campo requesterId ya no se pasa aquí, se maneja con el `requester: { connect: ... }`
        requesterName: data.requesterName, 
        requesterEmail: data.requesterEmail || null, 

        // *******************************************************************
        // CORRECCIÓN CLAVE:
        // ELIMINAR currentApproverId de aquí. Se establecerá a través de la conexión 'approver'.
        // currentApproverId: presidente.id, // <-- ELIMINAR ESTA LÍNEA
        // *******************************************************************

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
            userId: data.requesterId, // Este userId es para el log de actividad
            userName: data.requesterName,
            comment: "Solicitud creada inicialmente.",
          }]
        },

        attachments: data.attachmentsData
        && data.attachmentsData.length > 0 ? {
          createMany: {
            data: data.attachmentsData.map(att => ({
              fileName: att.fileName,
              url: "uploads/placeholder/" + Date.now() + "_" + att.fileName.replace(/\s+/g, '_'),
              size: att.size,
              type: att.type || 'application/octet-stream',
              uploadedById: data.requesterId, // Asegúrate de asignar quién subió el adjunto
            }))
          }
        } : undefined,

        requester: { connect: { id: data.requesterId } }, // Conexión para el solicitante
        approver: { connect: { id: presidente.id } } // <--- AÑADIDO: Conexión para el aprobador
      }
    });

    if (newApproval && data.requesterEmail) {
      await logAuditEvent(data.requesterEmail, `Creación de Solicitud de Aprobación (${data.type})`, `Asunto: ${data.subject}, ID: ${newApproval.id}`);
    }

    await sendNtfyNotification({
      title: `Nueva Solicitud de Aprobación: ${data.type}`,
      message: `Solicitud "${data.subject}" por ${data.requesterName} (ID: ${newApproval.id}) está pendiente.`,
      tags: ['aprobacion', 'nueva', data.type.toLowerCase()],
    });

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
  } catch (error: any) {
    console.error("createApprovalRequestAction Error:", error);
    const userEmailForLog = values.requesterEmail || 'unknown_user_for_approval_creation';
    await logAuditEvent(userEmailForLog, `Error en Creación de Solicitud de Aprobación (${values.type})`, `Error: ${error.message || String(error)}`);
    return { success: false, message: "Error de base de datos al crear solicitud de aprobación: " + (error.message || "Error desconocido.") };
  }
}

export async function getApprovalRequestsForUser(userId: string, userRole: ClientUserRole) {
  try {
    const prismaRole = roleStringToPrismaEnumMap[userRole];
    
    // Base include for all queries
    const includeRelations = {
      attachments: true,
      activityLog: {
        // CORRECCIÓN CLAVE: Usar 'desc' como string literal con aserción de tipo
        orderBy: { timestamp: 'desc' as const } 
      },
      requester: { select: { name: true, email: true } }, // Incluir datos del solicitante
      approver: { select: { name: true, email: true } }, // Incluir datos del aprobador
      paymentInstallments: { 
        // CORRECCIÓN CLAVE: Usar 'asc' como string literal con aserción de tipo
        orderBy: { dueDate: 'asc' as const } 
      },
    };

    if (prismaRole === PrismaRole.Presidente) {
      return await prisma.approvalRequest.findMany({
        where: { status: { in: [PrismaApprovalStatus.Pendiente, PrismaApprovalStatus.InformacionSolicitada] } },
        include: includeRelations, // Incluir las relaciones necesarias
        // CORRECCIÓN CLAVE: Usar 'desc' como string literal con aserción de tipo
        orderBy: { createdAt: 'desc' as const } 
      });
    }
    
    // Para otros roles (como 'User'), solo verán sus propias solicitudes creadas
    return await prisma.approvalRequest.findMany({
      where: { requesterId: userId },
      include: includeRelations, // Incluir las relaciones necesarias
      // CORRECCIÓN CLAVE: Usar 'desc' como string literal con aserción de tipo
      orderBy: { createdAt: 'desc' as const } 
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
            // CORRECCIÓN CLAVE: Eliminar la inclusión de 'user' aquí
            // ya que ApprovalActivityLogEntry no tiene una relación 'user'
            // include: { user: { select: { name: true }}}, 
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
      return { success: false, message: "Información del aprobador incompleta."};
    }

    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, message: "Solicitud no encontrada." };
    }
    if (request.status !== PrismaApprovalStatus.Pendiente && request.status !== PrismaApprovalStatus.InformacionSolicitada) {
      return { success: false, message: "La solicitud no está en un estado que permita aprobación."
      };
    }

    let validatedData: any;
    if (request.type === PrismaApprovalRequestType.PagoProveedor && approvedPaymentType) {
        if (approvedPaymentType === "Contado") {
            validatedData = ApprovePagoProveedorContadoSchema.parse(values);
        } else if (approvedPaymentType === "Cuotas") {
            validatedData = ApprovePagoProveedorCuotasSchema.parse(values);
        } else {
            return { success: false, message: "Tipo de pago no válido para Pago a Proveedor."
            };
        }
    } else if (request.type === PrismaApprovalRequestType.Compra) {
        validatedData = ApproveCompraSchema.parse(values);
    } else {
        return { success: false, message: "Tipo de solicitud desconocida o tipo de pago no proporcionado para Pago a Proveedor."
        };
    }

    await prisma.$transaction(async (tx) => {
        const updateData: any = {
            status: PrismaApprovalStatus.Aprobado,
            // Eliminado: approverId (en la corrección anterior)
            approverComment: validatedData.comment || null,
            approvedAt: new Date(),
            approverName: approverName,
            approver: { connect: { id: approverId }}, // <-- Esta es la conexión que Prisma espera
        };

        if (request.type === PrismaApprovalRequestType.PagoProveedor && validatedData.approvedPaymentType) {
          updateData.approvedPaymentType = paymentTypeStringToPrismaEnumMap[validatedData.approvedPaymentType as ClientPaymentType];
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
                comment:
                validatedData.comment || "Aprobado sin comentarios adicionales.",
                // Eliminado: user: { connect: { id: approverId }},
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
    await logAuditEvent(approverEmail || 'unknown_approver', "Error en Aprobación de Solicitud", `ID Solicitud: ${requestId}, Error: ${error.message || String(error)}`);
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
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0]
    || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;
  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, message: "Solicitud no encontrada." };
    }
     if (request.status !== PrismaApprovalStatus.Pendiente && request.status !== PrismaApprovalStatus.InformacionSolicitada) {
      return { success: false, message: "La solicitud no está en un estado que permita rechazo."
      };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: PrismaApprovalStatus.Rechazado,
                rejectedAt: new Date(),
                approverName: approverName,
                approverComment: comment,
                approver: { connect: { id: approverId }},
            }
        });

        await
        tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: requestId,
                action: "Solicitud Rechazada",
                userId: approverId,
                userName: approverName,
                comment: comment,

              // Eliminado: user: { connect: { id: approverId }},
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
  } catch (error: any) {
    console.error("rejectRequestAction Error:", error);
    await logAuditEvent(approverEmail || 'unknown_approver', "Error en Rechazo de Solicitud", `ID Solicitud: ${requestId}, Error: ${error.message || String(error)}`);
    return { success: false, message: "Error de base de datos al rechazar solicitud: " + (error.message || "Error desconocido.") };
  }
}


export async function requestMoreInfoAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] ||
    "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;
  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, message: "Solicitud no encontrada." };
    }
     if (request.status !== PrismaApprovalStatus.Pendiente && request.status !== PrismaApprovalStatus.InformacionSolicitada) {
      return { success: false, message: "La solicitud no está en un estado que permita solicitar más información."
      };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: PrismaApprovalStatus.InformacionSolicitada,
                infoRequestedAt: new Date(),
                approverName: request.approverName || approverName,
                approverComment: comment,
                approver: { connect: { id: request.approverId || approverId }},
            }
        });

        await tx.approvalActivityLogEntry.create({

            data: {
                approvalRequestId: requestId,
                action: "Información Adicional Solicitada",
                userId: approverId,
                userName: approverName,
                comment: comment
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
  } catch (error: any) {
    console.error("requestMoreInfoAction Error:", error);
    await logAuditEvent(approverEmail, "Error en Solicitud de Más Información", `ID Solicitud: ${requestId}, Error: ${error.message || String(error)}`);
    return { success: false, message: "Error de base de datos al solicitar más información: " + (error.message || "Error desconocido.") };
  }
}

// --- Gestión de Casos de Mantenimiento Actions ---
const casoMantenimientoStatusStringToPrismaEnumMap: Record<ClientCasoMantenimientoStatus, PrismaCasoMantenimientoStatus> = {
  'Registrado': PrismaCasoMantenimientoStatus.Registrado,
  'PendientePresupuesto': PrismaCasoMantenimientoStatus.PendientePresupuesto, // Clave sin espacio
  'PresupuestoAprobado': PrismaCasoMantenimientoStatus.PresupuestoAprobado, // Clave sin espacio
  'EnServicioReparacion': PrismaCasoMantenimientoStatus.EnServicioReparacion, // Clave sin espacio/acentos
  'PendienteRespaldo': PrismaCasoMantenimientoStatus.PendienteRespaldo, // Clave sin espacio
  'Resuelto': PrismaCasoMantenimientoStatus.Resuelto,
  'Cancelado': PrismaCasoMantenimientoStatus.Cancelado,
};
const casoMantenimientoPriorityStringToPrismaEnumMap: Record<ClientCasoMantenimientoPriority, PrismaCasoMantenimientoPriority> = {
  'Baja': PrismaCasoMantenimientoPriority.Baja,
  'Media': PrismaCasoMantenimientoPriority.Media,
  'Alta': PrismaCasoMantenimientoPriority.Alta,
  'Critica': PrismaCasoMantenimientoPriority.Critica, // Clave sin acento
};

export async function createCasoMantenimientoAction( // [cite: 356]
  values: z.infer<typeof CreateCasoMantenimientoFormSchema>, // [cite: 357]
  currentUserId: string, // [cite: 357]
  currentUserName: string, // [cite: 357]
  currentUserEmail: string // [cite: 357]
): Promise<{ success: boolean; // [cite: 357]
  message: string; casoId?: string; errors?: any }> { // [cite: 357]
  try {
    const validatedFields = CreateCasoMantenimientoFormSchema.safeParse(values); // [cite: 358]
    if (!validatedFields.success) { // [cite: 358]
      return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación al crear el caso." // [cite: 359]
      }; // [cite: 359]
    } // [cite: 359]
    const data = validatedFields.data; // [cite: 359]

    const newCaso = await prisma.casoDeMantenimiento.create({ // [cite: 360]
      data: { // [cite: 360]
        title: data.title, // [cite: 360]
        description: data.description, // [cite: 360]
        location: data.location, // [cite: 360]
        equipment: data.equipment || null, // [cite: 360]
        priority: casoMantenimientoPriorityStringToPrismaEnumMap[data.priority], // [cite: 360]
        assignedProviderName: data.assignedProviderName, // [cite: 360]
        currentStatus: PrismaCasoMantenimientoStatus.Registrado, // [cite: 360]
        registeredAt: new Date(), // [cite: 360]
     // [cite: 360]    
        registeredByUserId: currentUserId, // [cite: 361]
        registeredByUserName: currentUserName, // [cite: 361]
        log: {
          create: [{
            action: "Caso Registrado",
            notes: "Caso de mantenimiento inicial registrado.",
            userId: currentUserId,
            userName: currentUserName,
            statusAfterAction: PrismaCasoMantenimientoStatus.Registrado
          }]
        } // [cite: 363]
      } // [cite: 363]
    }); // [cite: 363]
    await logAuditEvent(currentUserEmail, "Registro de Nuevo Caso de Mantenimiento", `Título: ${data.title}, ID: ${newCaso.id}`); // [cite: 364]
    await sendNtfyNotification({ // [cite: 364]
      title: `Nuevo Caso de Mantenimiento: ${data.title.substring(0,30)}...`, // [cite: 364]
      message: `Caso #${newCaso.id} (${data.title}) registrado por ${currentUserName}. Proveedor: ${data.assignedProviderName}.`, // [cite: 364]
      tags: ['mantenimiento', 'nuevo', data.priority.toLowerCase()], // [cite: 364]
      priority: data.priority === 'Critica' ? 5 : (data.priority === 'Alta' ? 4 : 3), // [cite: 364]
    }); // [cite: 365]
    revalidatePath("/mantenimiento"); // [cite: 365]

    return { // [cite: 365]
      success: true, // [cite: 366]
      message: "Caso de mantenimiento registrado exitosamente.", // [cite: 366]
      casoId: newCaso.id, // [cite: 366]
    }; // [cite: 366]
  } catch (error: any) { // [cite: 367]
    console.error("createCasoMantenimientoAction Error:", error); // [cite: 367]
    await logAuditEvent(currentUserEmail, "Error en Registro de Caso de Mantenimiento", `Error: ${error.message || String(error)}`); // [cite: 367]
    return { success: false, message: "Error de base de datos al crear caso de mantenimiento: " + (error.message || "Error desconocido.") }; // [cite: 368]
  } // [cite: 368]
}

export async function getAllCasosMantenimientoAction() { // [cite: 368]
  try {
    return await prisma.casoDeMantenimiento.findMany({ // [cite: 368]
      include: { // [cite: 369]
        registeredByUser: { select: { name: true }}, // [cite: 369]
        log: { orderBy: { timestamp: 'desc' } }
      }, // [cite: 369]
      orderBy: { registeredAt: 'desc' } // [cite: 369]
    }); // [cite: 370]
  } catch (error) { // [cite: 370]
    console.error("getAllCasosMantenimientoAction Error:", error); // [cite: 370]
    return []; // [cite: 370]
  } // [cite: 370]
}

export async function getCasoMantenimientoByIdAction(id: string) { // [cite: 371]
   try {
    return await prisma.casoDeMantenimiento.findUnique({ // [cite: 371]
      where: { id }, // [cite: 371]
      include: { // [cite: 371]
        registeredByUser: { select: { name: true }}, // [cite: 372]
        log: { // [cite: 372]
          orderBy: { timestamp: 'desc' }, // [cite: 372]
          include: {user: {select: {name: true}}} // [cite: 372]
        } // [cite: 372]
      } // [cite: 372]
    // [cite: 371] 
    }); // [cite: 371]
  } catch (error) { // [cite: 372]
    console.error(`getCasoMantenimientoByIdAction Error for ID ${id}:`, error); // [cite: 372]
    return null; // [cite: 372]
  } // [cite: 373]
}


export async function updateCasoMantenimientoAction( // [cite: 373]
  casoId: string, // [cite: 373]
  updates: z.infer<typeof UpdateCasoMantenimientoFormSchema>, // [cite: 373]
  actingUserId: string, // [cite: 373]
  actingUserName: string, // [cite: 373]
  actingUserEmail: string // [cite: 373]
): Promise<{ success: boolean; // [cite: 373]
  message: string; }> { // [cite: 373]
  try {
   const validatedFields = UpdateCasoMantenimientoFormSchema.safeParse(updates); // [cite: 374]
   if (!validatedFields.success) { // [cite: 374]
     return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) }; // [cite: 375]
   } // [cite: 375]
   const { currentStatus: clientStatus, notes, assignedProviderName, nextFollowUpDate, resolutionDetails, cost, invoicingDetails, resolvedAt } = validatedFields.data; // [cite: 376]
   const casoToUpdate = await prisma.casoDeMantenimiento.findUnique({ where: { id: casoId }}); // [cite: 376]
   if (!casoToUpdate) { // [cite: 377]
      return { success: false, message: "Caso no encontrado." }; // [cite: 378]
   } // [cite: 378]

    const prismaStatus = casoMantenimientoStatusStringToPrismaEnumMap[clientStatus]; // [cite: 378]

    const dataToUpdate: any = { // [cite: 378]
        currentStatus: prismaStatus, // [cite: 379]
        assignedProviderName, // [cite: 379]
        nextFollowUpDate: nextFollowUpDate ? // [cite: 379]
        new Date(nextFollowUpDate) : null, // [cite: 379]
        lastFollowUpDate: new Date(), // [cite: 380]
    }; // [cite: 380]
    if (prismaStatus === PrismaCasoMantenimientoStatus.Resuelto) { // [cite: 380]
        if (!resolutionDetails || !resolvedAt) { // [cite: 381]
            return { success: false, message: "Para el estado 'Resuelto', los Detalles de Resolución y la Fecha de Resolución son obligatorios."}; // [cite: 381]
        } // [cite: 381]
        dataToUpdate.resolutionDetails = resolutionDetails; // [cite: 381]
        dataToUpdate.cost = cost; // [cite: 382]
        dataToUpdate.invoicingDetails = invoicingDetails || null; // [cite: 382]
        dataToUpdate.resolvedAt = new Date(resolvedAt); // [cite: 382]
    } else { // [cite: 382]
        dataToUpdate.resolutionDetails = null; // [cite: 383]
        dataToUpdate.cost = null; // [cite: 383]
        dataToUpdate.invoicingDetails = null; // [cite: 383]
        dataToUpdate.resolvedAt = null; // [cite: 383]
    } // [cite: 383]

    const newLogEntryData = {
      action: `Actualización: ${clientStatus}`,
      notes: notes,
      userId: actingUserId,
      userName: actingUserName,
      statusAfterAction: prismaStatus
  };
    await prisma.casoDeMantenimiento.update({ // [cite: 384]
        where: { id: casoId }, // [cite: 385]
        data: { // [cite: 385]
            ...dataToUpdate, // [cite: 385]
            log: { // [cite: 385]
                create: [newLogEntryData] // [cite: 385]
            } // [cite: 385]
        } // [cite: 385]
    }); // [cite: 385]
    await logAuditEvent(actingUserEmail, `Actualización de Caso de Mantenimiento: ${clientStatus}`, `ID Caso: ${casoId}. Notas: ${notes}`); // [cite: 386]
    await sendNtfyNotification({ // [cite: 386]
      title: `Caso de Mantenimiento #${casoId} Actualizado`, // [cite: 386]
      message: `El caso "${casoToUpdate.title}" cambió a estado ${clientStatus}. Notas: ${notes.substring(0,50)}...`, // [cite: 386]
      tags: ['mantenimiento', 'actualizacion-estado', casoId, clientStatus.toLowerCase().replace(/\s|\//g, '-')], // [cite: 387]
      priority: casoToUpdate.priority === PrismaCasoMantenimientoPriority.Critica ? 5 : 
                (casoToUpdate.priority === PrismaCasoMantenimientoPriority.Alta ? 4 : 3), // [cite: 364]
    }); // [cite: 387]
    revalidatePath(`/mantenimiento/${casoId}`); // [cite: 387]
    revalidatePath("/mantenimiento"); // [cite: 387]
    return { success: true, message: `Caso de mantenimiento actualizado a ${clientStatus}.` }; // [cite: 388]
   } catch (error: any) { // [cite: 388]
     console.error("updateCasoMantenimientoAction Error:", error); // [cite: 389]
     await logAuditEvent(actingUserEmail, "Error en Actualización de Caso de Mantenimiento", `ID Caso: ${casoId}, Error: ${error.message || String(error)}`); // [cite: 389]
     return { success: false, message: "Error de base de datos al actualizar caso de mantenimiento: " + (error.message || "Error desconocido.") }; // [cite: 390]
   } // [cite: 391]
}

// --- Sugerencia IA para tickets ---
export async function getAISolutionSuggestion(ticketDescription: string): Promise<{ suggestion?: string; error?: string }> {
  // Aquí deberías implementar la lógica real, por ejemplo, llamar a una API de IA.
  // Por ahora, devolvemos una sugerencia simulada:
  if (!ticketDescription || ticketDescription.trim() === "") {
    return { error: "La descripción del ticket está vacía." };
  }
  // Simulación de respuesta
  return { suggestion: "Esta es una sugerencia generada por IA para: " + ticketDescription };
}
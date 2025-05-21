
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User, InventoryItem, InventoryItemCategory, InventoryItemStatus, StorageType } from "./types";
import {
  addTicketToMock,
  getAllTicketsFromMock,
  getTicketByIdFromMock,
  getRawTicketsStoreForStats,
  getAllInventoryItemsFromMock,
  addInventoryItemToMock,
  getRawInventoryStore,
  updateInventoryItemInMock,
  deleteInventoryItemFromMock,
  getInventoryItemByIdFromMock
} from "./mock-data";
import { revalidatePath } from "next/cache";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";
import { INVENTORY_ITEM_CATEGORIES, INVENTORY_ITEM_STATUSES } from "./types";

// --- Ticket Creation ---
const CreateTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]),
});

export async function createTicketAction(
  userId: string,
  userName: string,
  values: z.infer<typeof CreateTicketSchema>
) {
  const validatedFields = CreateTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al crear ticket debido a errores de validación.",
    };
  }

  const { subject, description, priority } = validatedFields.data;

  const currentTickets = getRawTicketsStoreForStats();
  const newTicket: Ticket = {
    id: (currentTickets.length + 1).toString() + Date.now().toString(),
    subject,
    description,
    priority: priority as TicketPriority,
    status: "Open",
    attachments: [],
    userId,
    userName,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  };

  addTicketToMock(newTicket);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${newTicket.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");


  return {
    success: true,
    message: "¡Ticket creado exitosamente!",
    ticketId: newTicket.id,
  };
}

// --- Add Comment ---
const AddCommentSchema = z.object({
  text: z.string().min(1, "El comentario no puede estar vacío."),
});

export async function addCommentAction(
  ticketId: string,
  commenter: User,
  values: z.infer<typeof AddCommentSchema>
) {
  const validatedFields = AddCommentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false, 
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al añadir comentario debido a errores de validación.",
    };
  }

  const ticket = getTicketByIdFromMock(ticketId);
  if (!ticket) {
    return { success: false, message: "Ticket no encontrado." };
  }

  const newComment: Comment = {
    id: `comment-${ticketId}-${ticket.comments.length + 1}-${Date.now()}`,
    text: validatedFields.data.text,
    userId: commenter.id,
    userName: commenter.name,
    userAvatarUrl: commenter.avatarUrl,
    createdAt: new Date(),
  };

  ticket.comments.push(newComment);
  ticket.updatedAt = new Date();

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");

  return {
    success: true,
    message: "¡Comentario añadido exitosamente!",
    comment: newComment,
  };
}

// --- Update Ticket Status ---
const UpdateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES_ENGLISH as [TicketStatus, ...TicketStatus[]]),
});

export async function updateTicketStatusAction(
  ticketId: string,
  values: z.infer<typeof UpdateTicketStatusSchema>
) {
  const validatedFields = UpdateTicketStatusSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al actualizar estado debido a errores de validación.",
    };
  }

  const ticket = getTicketByIdFromMock(ticketId);
  if (!ticket) {
    return { success: false, message: "Ticket no encontrado." };
  }

  ticket.status = validatedFields.data.status as TicketStatus;
  ticket.updatedAt = new Date();

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");

  const statusDisplayMap: Record<TicketStatus, string> = {
    Open: "Abierto",
    "In Progress": "En Progreso",
    Resolved: "Resuelto",
    Closed: "Cerrado",
  };

  return {
    success: true,
    message: `Estado del ticket actualizado a ${statusDisplayMap[ticket.status]}.`,
  };
}

// --- Fetch Ticket by ID ---
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  return getTicketByIdFromMock(ticketId);
}

// --- Fetch All Tickets ---
export async function getAllTickets(): Promise<Ticket[]> {
  return getAllTicketsFromMock();
}

// --- Fetch Dashboard Stats ---
export async function getDashboardStats() {
  const currentTickets = getRawTicketsStoreForStats();

  const total = currentTickets.length;
  const open = currentTickets.filter(t => t.status === "Open").length;
  const inProgress = currentTickets.filter(t => t.status === "In Progress").length;
  const resolved = currentTickets.filter(t => t.status === "Resolved").length;
  const closed = currentTickets.filter(t => t.status === "Closed").length;

  const priorityDisplayMap: Record<TicketPriority, string> = { Low: "Baja", Medium: "Media", High: "Alta" };
  const statusDisplayMap: Record<TicketStatus, string> = { Open: "Abierto", "In Progress": "En Progreso", Resolved: "Resuelto", Closed: "Cerrado"};

  const byPriority = (TICKET_PRIORITIES_ENGLISH).map(pKey  => ({
    name: priorityDisplayMap[pKey],
    value: currentTickets.filter(t => t.priority === pKey).length,
  }));

  const byStatus = (TICKET_STATUSES_ENGLISH).map(sKey => ({
    name: statusDisplayMap[sKey],
    value: currentTickets.filter(t => t.status === sKey).length,
  }));

  return {
    summary: { total, open, inProgress, resolved, closed },
    stats: { byPriority, byStatus },
  };
}

// --- Inventory Actions ---

// Fetch All Inventory Items
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  return getAllInventoryItemsFromMock();
}

const RAM_OPTIONS = ["No Especificado", "2GB", "4GB", "8GB", "12GB", "16GB", "32GB", "64GB", "Otro"] as const;
const STORAGE_TYPES_ZOD_ENUM = ["HDD", "SSD"] as [StorageType, ...StorageType[]];

const BaseInventoryItemSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  category: z.enum(INVENTORY_ITEM_CATEGORIES),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  serialNumber: z.string().max(100).optional(),
  processor: z.string().max(100).optional(), 
  ram: z.enum(RAM_OPTIONS).optional(),
  storageType: z.enum(STORAGE_TYPES_ZOD_ENUM).optional(),
  storage: z.string().max(50).optional(),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
  location: z.string().max(100).optional(),
  status: z.enum(INVENTORY_ITEM_STATUSES),
  notes: z.string().max(500).optional(),
});

const categoryPrefixMap: Record<InventoryItemCategory, string> = {
  Computadora: "PC",
  Monitor: "MON",
  Teclado: "TEC",
  Mouse: "MOU",
  Impresora: "IMP",
  Escaner: "ESC",
  Router: "ROU",
  Switch: "SWI",
  Servidor: "SRV",
  Laptop: "LAP",
  Tablet: "TAB",
  Proyector: "PRO",
  "Telefono IP": "TIP",
  "Otro Periferico": "PER",
  Software: "SOF",
  Licencia: "LIC",
  Otro: "OTR",
};

export async function addInventoryItemAction(
  currentUser: Pick<User, 'id' | 'name'>,
  values: z.infer<typeof BaseInventoryItemSchema>
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al añadir artículo debido a errores de validación.",
    };
  }

  const data = validatedFields.data;
  
  const prefix = categoryPrefixMap[data.category as InventoryItemCategory];
  const allItems = getRawInventoryStore(); 

  let maxNum = 0;
  allItems.forEach(item => {
    if (item.id.startsWith(`${prefix}-IEQ-`)) {
      try {
        const numPart = parseInt(item.id.substring(item.id.lastIndexOf('-') + 1), 10);
        if (numPart > maxNum) {
          maxNum = numPart;
        }
      } catch (e) {
        console.error("Error parsing item ID number:", item.id, e);
      }
    }
  });

  const newNum = maxNum + 1;
  const formattedNum = String(newNum).padStart(3, '0');
  const newId = `${prefix}-IEQ-${formattedNum}`;

  const newItem: InventoryItem = {
    id: newId,
    ...data, 
    category: data.category as InventoryItemCategory, 
    status: data.status as InventoryItemStatus, 
    addedByUserId: currentUser.id,
    addedByUserName: currentUser.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  addInventoryItemToMock(newItem);
  revalidatePath("/inventory");

  return {
    success: true,
    message: `Artículo "${newItem.name}" con ID "${newId}" añadido exitosamente.`,
    item: newItem,
  };
}

export async function updateInventoryItemAction(
  itemId: string,
  values: z.infer<typeof BaseInventoryItemSchema>
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al actualizar artículo debido a errores de validación.",
    };
  }
  const itemToUpdate = getInventoryItemByIdFromMock(itemId);
  if (!itemToUpdate) {
    return { success: false, message: "Artículo no encontrado." };
  }
  
  const updatedData = validatedFields.data;

  const updatedItem: InventoryItem = {
    ...itemToUpdate,
    ...updatedData,
    category: updatedData.category as InventoryItemCategory,
    status: updatedData.status as InventoryItemStatus,
    updatedAt: new Date(),
  };

  const success = updateInventoryItemInMock(updatedItem);

  if (success) {
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${updatedItem.name}" actualizado exitosamente.` };
  } else {
    return { success: false, message: "No se pudo actualizar el artículo." };
  }
}

export async function deleteInventoryItemAction(itemId: string) {
  const success = deleteInventoryItemFromMock(itemId);
  if (success) {
    revalidatePath("/inventory");
    return { success: true, message: "Artículo eliminado exitosamente." };
  } else {
    return { success: false, message: "No se pudo eliminar el artículo o no fue encontrado." };
  }
}

    
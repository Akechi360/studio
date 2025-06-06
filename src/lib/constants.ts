// src/lib/constants.ts

import type { TicketPriority, TicketStatus } from "@/lib/types";
// Importar el enum TicketStatus y TicketPriority de Prisma para usarlos en los mapeos
import { TicketStatus as PrismaTicketStatus, TicketPriority as PrismaTicketPriority } from "@prisma/client"; // <--- MODIFICADO: AÑADIDO PrismaTicketPriority

export const TICKET_PRIORITIES_ENGLISH: TicketPriority[] = ["Low", "Medium", "High"];
export const TICKET_STATUSES_ENGLISH: TicketStatus[] = ["Open", "InProgress", "Resolved", "Closed"];

export const TICKET_PRIORITIES: string[] = ["Baja", "Media", "Alta"];
export const TICKET_STATUSES: string[] = ["Abierto", "En Progreso", "Resuelto", "Cerrado"];

export const APP_NAME = "IEQ Nexo";

// **** AÑADIDOS: Mapeos para el estado de los tickets ****
// Mapea la cadena de texto de la UI (inglés) al valor del enum de Prisma (que va a la DB)
export const ticketStatusStringToPrismaEnumMap: Record<string, PrismaTicketStatus> = {
  "Open": PrismaTicketStatus.Open,
  "InProgress": PrismaTicketStatus.InProgress,
  "Resolved": PrismaTicketStatus.Resolved,
  "Closed": PrismaTicketStatus.Closed,
};

// Mapea el valor del enum de Prisma (de la DB) a la cadena de texto en español para mostrar en la UI
export const ticketStatusPrismaEnumToStringMap: Record<PrismaTicketStatus, string> = {
  [PrismaTicketStatus.Open]: "Abierto",
  [PrismaTicketStatus.InProgress]: "En Progreso",
  [PrismaTicketStatus.Resolved]: "Resuelto",
  [PrismaTicketStatus.Closed]: "Cerrado",
};

// **** AÑADIDO: Mapeo para la prioridad de los tickets ****
// Mapea la cadena de texto de la UI (inglés) al valor del enum de Prisma (que va a la DB)
export const ticketPriorityStringToPrismaEnumMap: Record<TicketPriority, PrismaTicketPriority> = {
    "Low": PrismaTicketPriority.Low,
    "Medium": PrismaTicketPriority.Medium,
    "High": PrismaTicketPriority.High,
};
// *******************************************************
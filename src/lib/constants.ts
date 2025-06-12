// src/lib/constants.ts

import type { TicketPriority, TicketStatus, TicketCategory } from "@/lib/types";
import { TicketStatus as PrismaTicketStatus, TicketPriority as PrismaTicketPriority, TicketCategory as PrismaTicketCategory } from "@prisma/client";

export const TICKET_PRIORITIES_ENGLISH: TicketPriority[] = ["Low", "Medium", "High"];
export const TICKET_STATUSES_ENGLISH: TicketStatus[] = ["Open", "InProgress", "Resolved", "Closed"];

export const TICKET_PRIORITIES: string[] = ["Baja", "Media", "Alta"];
export const TICKET_STATUSES: string[] = ["Abierto", "En Progreso", "Resuelto", "Cerrado"];

export const TICKET_CATEGORIES_ENGLISH: TicketCategory[] = [
  "HardwareIssue",
  "SoftwareIssue",
  "NetworkIssue",
  "AppAccess",
  "InfoRequest",
  "EquipmentMaintenance",
  "PrintingIssue",
  "EmailIssue",
  "Other"
];

export const APP_NAME = "IEQ Nexo";

// Mapeos para el estado de los tickets
export const ticketStatusStringToPrismaEnumMap: Record<string, PrismaTicketStatus> = {
  "Open": PrismaTicketStatus.Open,
  "InProgress": PrismaTicketStatus.InProgress,
  "Resolved": PrismaTicketStatus.Resolved,
  "Closed": PrismaTicketStatus.Closed,
};

export const ticketStatusPrismaEnumToStringMap: Record<PrismaTicketStatus, string> = {
  [PrismaTicketStatus.Open]: "Abierto",
  [PrismaTicketStatus.InProgress]: "En Progreso",
  [PrismaTicketStatus.Resolved]: "Resuelto",
  [PrismaTicketStatus.Closed]: "Cerrado",
};

// Mapeo para la prioridad de los tickets
export const ticketPriorityStringToPrismaEnumMap: Record<TicketPriority, PrismaTicketPriority> = {
  "Low": PrismaTicketPriority.Low,
  "Medium": PrismaTicketPriority.Medium,
  "High": PrismaTicketPriority.High,
};

// Mapeo para la categoría de los tickets
export const ticketCategoryStringToPrismaEnumMap: Record<string, PrismaTicketCategory> = {
  HardwareIssue: PrismaTicketCategory.HardwareIssue,
  SoftwareIssue: PrismaTicketCategory.SoftwareIssue,
  NetworkIssue: PrismaTicketCategory.NetworkIssue,
  AppAccess: PrismaTicketCategory.AppAccess,
  InfoRequest: PrismaTicketCategory.InfoRequest,
  EquipmentMaintenance: PrismaTicketCategory.EquipmentMaintenance,
  PrintingIssue: PrismaTicketCategory.PrintingIssue,
  EmailIssue: PrismaTicketCategory.EmailIssue,
  Other: PrismaTicketCategory.Other,
};
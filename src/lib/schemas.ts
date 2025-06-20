import { z } from "zod";
import {
  INVENTORY_ITEM_CATEGORIES,
  INVENTORY_ITEM_STATUSES,
  RAM_OPTIONS,
  STORAGE_TYPES_ZOD_ENUM,
  CASO_STATUSES,
  CASO_PRIORITIES,
  ApprovalRequestType,
  PaymentType,
  TicketPriority,
  TicketStatus,
  Role,
  TicketCategory,
} from "./types";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH, TICKET_CATEGORIES_ENGLISH } from "./constants";


// --- User Schemas (from auth-context originally, moved here for server action use) ---
const UserRoleZodEnum = z.enum([PrismaRole.User, PrismaRole.Admin, PrismaRole.Presidente]);

export const UpdateUserByAdminFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce una dirección de correo válida."),
  role: UserRoleZodEnum,
  department: z.string().optional(), // Or .nullable() if you want to explicitly send null
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
});


// --- Ticket Schemas ---
export const CreateTicketClientSchema = z.object({
  subject: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]),
  userEmail: z.string().email(),
  category: z.enum(TICKET_CATEGORIES_ENGLISH as [TicketCategory, ...TicketCategory[]]),
  departamento: z.string().min(1, "Debes seleccionar un departamento."),
});

export const AddCommentClientSchema = z.object({
  text: z.string().min(1, { message: "El comentario no puede estar vacío." }).max(1000, { message: "El comentario no puede exceder los 1000 caracteres."}),
});

export const UpdateTicketStatusClientSchema = z.object({
  status: z.enum(TICKET_STATUSES_ENGLISH as [TicketStatus, ...TicketStatus[]]),
  actingUserEmail: z.string().email(),
});


// --- Inventory Schemas ---
export const BaseInventoryItemSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  category: z.enum(INVENTORY_ITEM_CATEGORIES as unknown as [InventoryItemCategory, ...InventoryItemCategory[]]),
  brand: z.string().max(50).optional().nullable(),
  model: z.string().max(50).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  processor: z.string().max(100).optional().nullable(),
  ram: z.enum(RAM_OPTIONS as unknown as [RamOption, ...RamOption[]]).optional().nullable(),
  storageType: z.enum(STORAGE_TYPES_ZOD_ENUM as unknown as [StorageType, ...StorageType[]]).optional().nullable(),
  storage: z.string().max(50).optional().nullable(),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
  location: z.string().max(100).optional().nullable(),
  status: z.enum(INVENTORY_ITEM_STATUSES as unknown as [InventoryItemStatus, ...InventoryItemStatus[]]),
  notes: z.string().max(500).optional().nullable(),
});

// --- Approval Schemas ---
export const AttachmentDataSchema = z.object({
  fileName: z.string(),
  size: z.number(),
  type: z.string().optional(),
});

const CreateApprovalRequestBaseSchema = z.object({
  type: z.enum(["Compra", "PagoProveedor"] as [ApprovalRequestType, ...ApprovalRequestType[]]),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres.").max(100),
  description: z.string().max(2000).optional(),
  requesterId: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string().email().optional(),
  attachmentsData: z.array(AttachmentDataSchema).optional(),
});

export const PurchaseRequestDataSchema = CreateApprovalRequestBaseSchema.extend({
  type: z.literal("Compra"),
  itemDescription: z.string().min(3, "El ítem es obligatorio.").max(200),
  estimatedPrice: z.coerce.number({ invalid_type_error: "Debe ser un número."}).positive({ message: "El precio debe ser positivo." }).optional(),
  supplierCompra: z.string().max(100).optional(),
});

export const PaymentRequestDataSchema = CreateApprovalRequestBaseSchema.extend({
  type: z.literal("PagoProveedor"),
  supplierPago: z.string().min(3, "El proveedor es obligatorio.").max(100),
  totalAmountToPay: z.coerce.number().positive("El monto debe ser positivo."),
  description: z.string().min(10, {message: "Por favor, incluye la fecha requerida de pago en la descripción."}).max(2000).optional(),
});

export const CreateApprovalRequestActionSchema = z.discriminatedUnion("type", [
  PurchaseRequestDataSchema,
  PaymentRequestDataSchema,
]);


// --- Approval Actions Panel Schemas ---
export const PaymentInstallmentActionSchema = z.object({
  id: z.string(),
  amount: z.coerce.number().positive("El monto de la cuota debe ser positivo."),
  dueDate: z.date({ coerce: true, required_error: "La fecha de vencimiento de la cuota es obligatoria." }),
});

export const ApproveActionBaseSchema = z.object({
  requestId: z.string(),
  approverId: z.string(),
  approverName: z.string(),
  approverEmail: z.string().email(),
  comment: z.string().optional(),
});

export const ApprovePagoProveedorContadoSchema = ApproveActionBaseSchema.extend({
  approvedPaymentType: z.literal('Contado'),
  approvedAmount: z.coerce.number().positive("Monto (Contado) debe ser positivo."),
  installments: z.array(PaymentInstallmentActionSchema).max(0, "No debe haber cuotas para pago de contado.").optional(),
});

export const ApprovePagoProveedorCuotasSchema = ApproveActionBaseSchema.extend({
  approvedPaymentType: z.literal('Cuotas'),
  approvedAmount: z.coerce.number().positive("Monto total para cuotas debe ser positivo."),
  installments: z.array(PaymentInstallmentActionSchema).min(1, "Se requiere al menos una cuota."),
}).superRefine((data, ctx) => {
  if (data.installments && data.installments.length > 0) {
    const sumOfInstallments = data.installments.reduce((sum, inst) => sum + inst.amount, 0);
    if (Math.abs(sumOfInstallments - data.approvedAmount) > 0.01) { // Tolerance for float precision
        ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La suma de las cuotas debe igualar el Monto Aprobado para Cuotas.",
        path: ["installments"],
        });
    }
  }
});

export const ApproveCompraSchema = ApproveActionBaseSchema.extend({
  approvedPaymentType: z.undefined().optional(),
  approvedAmount: z.undefined().optional(),
  installments: z.undefined().optional(),
});

export const RejectOrInfoActionSchema = ApproveActionBaseSchema.extend({
  comment: z.string().min(1, "Se requiere un comentario para esta acción."),
});


// --- Mantenimiento Schemas ---
export const CreateCasoMantenimientoFormSchema = z.object({
  title: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }).max(150),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(2000),
  location: z.string().min(3, { message: "La ubicación debe tener al menos 3 caracteres." }).max(100),
  equipment: z.string().max(100).optional(),
  priority: z.enum(CASO_PRIORITIES as unknown as [CasoMantenimientoPriority, ...CasoMantenimientoPriority[]]),
  assignedProviderName: z.string().min(1, { message: "El proveedor asignado es obligatorio." }).max(100),
});

export const UpdateCasoMantenimientoFormSchema = z.object({
  currentStatus: z.enum(CASO_STATUSES as unknown as [CasoMantenimientoStatus, ...CasoMantenimientoStatus[]]),
  notes: z.string().min(1, { message: "Se requieren notas para la actualización." }),
  assignedProviderName: z.string().min(1, "El proveedor es obligatorio.").max(100),
  nextFollowUpDate: z.date().optional().nullable(), // Allow null for clearing
  resolutionDetails: z.string().optional().nullable(),
  cost: z.coerce.number().positive("El costo debe ser un número positivo.").optional().nullable(),
  invoicingDetails: z.string().optional().nullable(),
  resolvedAt: z.date().optional().nullable(),
}).refine(data => {
  if (data.currentStatus === 'Resuelto') {
    return !!data.resolutionDetails && !!data.resolvedAt;
  }
  return true;
}, {
  message: "Para el estado 'Resuelto', los Detalles de Resolución y la Fecha de Resolución son obligatorios.",
  path: ["resolutionDetails"], // Or point to a more general path if preferred
});


// Helper for Prisma enums needed in Zod schemas
// It's better to import enums directly from @prisma/client in the files using them
// For Zod enums, you typically map them or use the string literals if they match.
// Example:
import { Role as PrismaRole, RamOption as PrismaRamOption, StorageType as PrismaStorageType } from "@prisma/client";
import type { InventoryItemCategory, InventoryItemStatus, RamOption, StorageType, CasoMantenimientoPriority, CasoMantenimientoStatus } from "./types";
// Zod enums from types.ts are usually like:
// export const MyEnum = ["Val1", "Val2"] as const;
// z.enum(MyEnum)

// For Prisma enums, if you need to use them directly in Zod:
// const PrismaRoleZod = z.nativeEnum(PrismaRole);
// But we are using string literal unions from types.ts for client-side form values,
// and mapping them to Prisma enums in server actions.

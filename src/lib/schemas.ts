
"use client"; // This file is imported by client components, so it can be client-side

import { z } from "zod";
import { 
  INVENTORY_ITEM_CATEGORIES, 
  INVENTORY_ITEM_STATUSES, 
  RAM_OPTIONS, 
  STORAGE_TYPES_ZOD_ENUM,
  CASO_STATUSES,
  CASO_PRIORITIES,
  ApprovalRequestType,
  PaymentType
} from "./types";

// --- Inventory Schemas ---
export const BaseInventoryItemSchema = z.object({
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
  priority: z.enum(CASO_PRIORITIES),
  assignedProviderName: z.string().min(1, { message: "El proveedor asignado es obligatorio." }).max(100),
});

export const UpdateCasoMantenimientoFormSchema = z.object({
  currentStatus: z.enum(CASO_STATUSES),
  notes: z.string().min(1, { message: "Se requieren notas para la actualización." }),
  assignedProviderName: z.string().min(1, "El proveedor es obligatorio.").max(100),
  nextFollowUpDate: z.date().optional(),
  resolutionDetails: z.string().optional(),
  cost: z.coerce.number().positive("El costo debe ser un número positivo.").optional(),
  invoicingDetails: z.string().optional(),
  resolvedAt: z.date().optional(),
}).refine(data => {
  if (data.currentStatus === 'Resuelto') {
    return !!data.resolutionDetails && !!data.resolvedAt;
  }
  return true;
}, {
  message: "Para el estado 'Resuelto', los Detalles de Resolución y la Fecha de Resolución son obligatorios.",
  path: ["resolutionDetails"],
});

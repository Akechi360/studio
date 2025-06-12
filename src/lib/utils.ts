import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function generateSequentialId(prefix: string): Promise<string> {
  // Obtener el último ID de la base de datos según el prefijo
  let lastNumber = 0;
  
  try {
    switch(prefix.toLowerCase()) {
      case 'ticket':
        const lastTicket = await prisma.ticket.findFirst({
          select: { displayId: true },
          orderBy: { displayId: 'desc' }
        });
        if (lastTicket?.displayId) {
          lastNumber = parseInt(lastTicket.displayId.split('-')[1]);
        }
        break;
      case 'appr':
        const lastApproval = await prisma.approvalRequest.findFirst({
          select: { displayId: true },
          orderBy: { displayId: 'desc' }
        });
        if (lastApproval?.displayId) {
          lastNumber = parseInt(lastApproval.displayId.split('-')[1]);
        }
        break;
      case 'comment':
        const lastComment = await prisma.comment.findFirst({
          select: { displayId: true },
          orderBy: { displayId: 'desc' }
        });
        if (lastComment?.displayId) {
          lastNumber = parseInt(lastComment.displayId.split('-')[1]);
        }
        break;
      case 'inv':
        const lastInventory = await prisma.inventoryItem.findFirst({
          select: { displayId: true },
          orderBy: { displayId: 'desc' }
        });
        if (lastInventory?.displayId) {
          lastNumber = parseInt(lastInventory.displayId.split('-')[1]);
        }
        break;
      case 'audit':
        const lastAudit = await prisma.auditLogEntry.findFirst({
          select: { displayId: true },
          orderBy: { displayId: 'desc' }
        });
        if (lastAudit?.displayId) {
          lastNumber = parseInt(lastAudit.displayId.split('-')[1]);
        }
        break;
    }
  } catch (error) {
    console.error(`Error getting last ${prefix} ID:`, error);
    // Si hay error, usar timestamp como fallback
    return `${prefix}-${Date.now()}`;
  }
  
  // Generar el nuevo número secuencial
  const newNumber = lastNumber + 1;
  
  // Agregar timestamp para evitar colisiones
  const timestamp = Date.now();
  return `${prefix}-${newNumber}-${timestamp}`;
}

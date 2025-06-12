import { PrismaClient, MaintenanceStatus, MaintenancePriority } from '@prisma/client';
import { CreateCasoDeMantenimientoData, CasoDeMantenimiento } from '../types/maintenance';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createCasoDeMantenimiento(data: CreateCasoDeMantenimientoData): Promise<CasoDeMantenimiento> {
  const { title, description, status, priority, assignedToId, assignedToName, assignedToEmail, createdById, createdByName, createdByEmail } = data;
  const displayId = await generateSequentialId('CasoDeMantenimiento');
  const caso = await prisma.casoDeMantenimiento.create({
    data: {
      title,
      description,
      status,
      priority,
      assignedToId,
      assignedToName,
      assignedToEmail,
      createdById,
      createdByName,
      createdByEmail,
      displayId,
    },
  });
  return caso;
} 
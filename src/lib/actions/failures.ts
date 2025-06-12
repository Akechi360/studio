import { PrismaClient } from '@prisma/client';
import { CreateFallaData, Falla } from '../types/failures';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createFalla(data: CreateFallaData): Promise<Falla> {
  const { titulo, descripcion, status, priority, assignedToId, assignedToName, assignedToEmail, createdById, createdByName, createdByEmail } = data;
  const displayId = await generateSequentialId('Falla');
  const falla = await prisma.falla.create({
    data: {
      titulo,
      descripcion,
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
  return falla;
} 
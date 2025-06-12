import { PrismaClient } from '@prisma/client';
import { CreateFallaBitacoraData, FallaBitacora } from '../types/failure-logs';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createFallaBitacora(data: CreateFallaBitacoraData): Promise<FallaBitacora> {
  const { fallaId, accion, details, userId, userName, userEmail } = data;
  const displayId = await generateSequentialId('FallaBitacora');
  const entry = await prisma.fallaBitacora.create({
    data: {
      fallaId,
      accion,
      details,
      userId,
      userName,
      userEmail,
      displayId,
    },
  });
  return entry;
} 
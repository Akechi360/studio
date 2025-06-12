import { PrismaClient } from '@prisma/client';
import { CreateCasoMantenimientoLogEntryData, CasoMantenimientoLogEntry } from '../types/maintenance-logs';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createCasoMantenimientoLogEntry(data: CreateCasoMantenimientoLogEntryData): Promise<CasoMantenimientoLogEntry> {
  const { casoId, action, userId, userName, userEmail } = data;
  const displayId = await generateSequentialId('CasoMantenimientoLogEntry');
  const entry = await prisma.casoMantenimientoLogEntry.create({
    data: {
      casoId,
      action,
      userId,
      userName,
      userEmail,
      displayId,
    },
  });
  return entry;
} 
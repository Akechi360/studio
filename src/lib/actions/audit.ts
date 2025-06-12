import { PrismaClient } from '@prisma/client';
import { CreateAuditLogEntryData, AuditLogEntry } from '../types/audit';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createAuditLogEntry(data: CreateAuditLogEntryData): Promise<AuditLogEntry> {
  const { userEmail, action } = data;
  const displayId = await generateSequentialId('AuditLogEntry');
  const entry = await prisma.auditLogEntry.create({
    data: {
      userEmail,
      action,
      displayId,
    },
  });
  return entry;
} 
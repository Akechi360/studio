import { PrismaClient } from '@prisma/client';
import { CreateApprovalActivityLogEntryData, ApprovalActivityLogEntry } from '../types/approval-activity';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createApprovalActivityLogEntry(data: CreateApprovalActivityLogEntryData): Promise<ApprovalActivityLogEntry> {
  const { approvalRequestId, action, userId, userName, userEmail } = data;
  const displayId = await generateSequentialId('ApprovalActivityLogEntry');
  const entry = await prisma.approvalActivityLogEntry.create({
    data: {
      approvalRequestId,
      action,
      userId,
      userName,
      userEmail,
      displayId,
    },
    include: {
      approvalRequest: true
    }
  });
  return entry as ApprovalActivityLogEntry;
} 
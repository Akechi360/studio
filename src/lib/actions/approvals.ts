import { PrismaClient, ApprovalStatus } from '@prisma/client';
import { CreateApprovalRequestData, ApprovalRequest } from '../types/approvals';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createApprovalRequest(data: CreateApprovalRequestData): Promise<ApprovalRequest> {
  const { type, status, amount, requesterId, requesterName, requesterEmail, approverId, approverName, approverEmail, ticketId, ticketSubject } = data;
  const displayId = await generateSequentialId('ApprovalRequest');
  const request = await prisma.approvalRequest.create({
    data: {
      type,
      status,
      amount,
      requesterId,
      requesterName,
      requesterEmail,
      approverId,
      approverName,
      approverEmail,
      ticketId,
      ticketSubject,
      displayId,
    },
  });
  return request;
} 
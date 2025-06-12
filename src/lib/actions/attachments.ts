import { PrismaClient } from '@prisma/client';
import { CreateAttachmentData, Attachment } from '../types/attachments';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createAttachment(data: CreateAttachmentData): Promise<Attachment> {
  const { fileName, fileType, fileSize, ticketId, userId, userName } = data;
  const displayId = await generateSequentialId('Attachment');
  const attachment = await prisma.attachment.create({
    data: {
      fileName,
      fileType,
      fileSize,
      ticketId,
      userId,
      userName,
      displayId,
    },
  });
  return attachment;
} 
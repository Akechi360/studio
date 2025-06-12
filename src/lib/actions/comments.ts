import { PrismaClient } from '@prisma/client';
import { CreateCommentData, Comment } from '../types/comments';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createComment(data: CreateCommentData): Promise<Comment> {
  const { text, ticketId, userId, userName, userEmail } = data;
  const displayId = await generateSequentialId('Comment');
  const comment = await prisma.comment.create({
    data: {
      text,
      ticketId,
      userId,
      userName,
      userEmail,
      displayId,
    },
  });
  return comment;
} 
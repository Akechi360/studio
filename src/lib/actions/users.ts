import { PrismaClient, Role } from '@prisma/client';
import { CreateUserData, User } from '../types/users';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function registerUser(data: CreateUserData): Promise<User> {
  const { name, email, password, role, department, avatarUrl } = data;
  const displayId = await generateSequentialId('User');
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      role: role || Role.User,
      department,
      avatarUrl,
      displayId,
    },
  });
  return user;
} 
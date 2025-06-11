const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    data: { avatarUrl: '/bg-login.jpg' }
  });
  console.log('Todos los avatarUrl actualizados a /bg-login.jpg');
  await prisma.$disconnect();
}

main(); 
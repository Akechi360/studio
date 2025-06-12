import { prisma } from '../src/lib/prisma';
import { generateSequentialId } from '../src/lib/id-generator';

async function updateUserDisplayIds() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { displayId: '' },
          { displayId: undefined }
        ]
      }
    });

    console.log(`Encontrados ${users.length} usuarios sin displayId`);

    for (const user of users) {
      const displayId = await generateSequentialId('User');
      await prisma.user.update({
        where: { id: user.id },
        data: { displayId }
      });
      console.log(`Actualizado usuario ${user.email} con displayId: ${displayId}`);
    }

    console.log('Actualización completada');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserDisplayIds(); 
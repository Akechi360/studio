import { prisma } from './prisma';

export async function generateSequentialId(entityName: string): Promise<string> {
  // Utilizamos el modelo IdCounter para generar un displayId secuencial y único
  const counter = await prisma.idCounter.upsert({
    where: { entityName },
    update: {
      lastUsedNumber: {
        increment: 1
      }
    },
    create: {
      entityName,
      lastUsedNumber: 1
    }
  });

  return `${entityName}-${counter.lastUsedNumber.toString().padStart(6, '0')}`;
}

module.exports = { generateSequentialId }; 
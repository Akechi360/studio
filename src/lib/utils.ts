import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function generateSequentialId(prefix: string): Promise<string> {
  // Obtener el último ID de la base de datos según el prefijo
  const lastItem = await prisma.$queryRaw`
    SELECT "displayId" FROM "${prefix.toLowerCase()}"
    ORDER BY CAST(SUBSTRING("displayId" FROM LENGTH('${prefix}-') + 1) AS INTEGER) DESC
    LIMIT 1
  `;
  
  // Extraer el número del último ID o empezar desde 1
  const lastNumber = lastItem?.[0]?.displayId 
    ? parseInt(lastItem[0].displayId.split('-')[1])
    : 0;
  
  // Generar el nuevo número secuencial
  const newNumber = lastNumber + 1;
  
  return `${prefix}-${newNumber}`;
}

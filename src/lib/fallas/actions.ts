"use server";

import { prisma } from "@/lib/prisma";
import { FallaFormValues, FallaFilter } from "./types";
import { EstadoFalla, SeveridadFalla, TipoFalla } from "@prisma/client";

export async function crearFalla(data: FallaFormValues, userId: string) {
  // Convertir los adjuntos a un formato JSON válido
  const adjuntosJson = data.adjuntos ? {
    files: data.adjuntos.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }))
  } : undefined;

  const falla = await prisma.falla.create({
    data: {
      ...data,
      adjuntos: adjuntosJson as any, // TODO: Mejorar el tipado
      reportadoPorId: userId,
      estado: EstadoFalla.REPORTADA,
      fechaDeteccion: new Date(),
    },
  });
  return falla;
}

export async function listarFallas(filtros: FallaFilter) {
  // TODO: Filtros avanzados
  return prisma.falla.findMany({
    orderBy: { createdAt: "desc" },
    include: { asignadoA: true, reportadoPor: true },
  });
}

// Función para crear una falla de prueba
export async function crearFallaPrueba(userId: string) {
  const falla = await prisma.falla.create({
    data: {
      titulo: "Falla de prueba",
      descripcion: "Esta es una falla de prueba creada automáticamente",
      equipoNombre: "Equipo de prueba",
      equipoUbicacion: "Ubicación de prueba",
      ubicacion: "Departamento de prueba",
      severidad: SeveridadFalla.MEDIA,
      tipoFalla: TipoFalla.OTRO,
      reportadoPorId: userId,
      estado: EstadoFalla.REPORTADA,
      fechaDeteccion: new Date(),
    },
  });
  return falla;
} 
import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/actions';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  const auth0User = session?.user;

  if (!auth0User || !auth0User.sub) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    let dbUser = await prisma.user.findUnique({
      where: { id: auth0User.sub },
    });

    if (!dbUser) {
      // Buscar por email antes de crear
      dbUser = await prisma.user.findUnique({
        where: { email: auth0User.email },
      });

      if (dbUser) {
        // Si existe por email, actualiza el id si es necesario
        if (dbUser.id !== auth0User.sub) {
          dbUser = await prisma.user.update({
            where: { email: auth0User.email },
            data: { id: auth0User.sub },
          });
        }
      } else {
        // Si no existe, créalo
        dbUser = await prisma.user.create({
          data: {
            id: auth0User.sub, // Usamos el 'sub' de Auth0 como 'id'
            email: auth0User.email || 'no-email-provided',
            name: auth0User.name || 'Usuario',
            avatarUrl: auth0User.picture || undefined,
            role: 'User', // Rol por defecto
          },
        });

        // Registrar el evento de creación de usuario
        await logAuditEvent(
          auth0User.email || 'no-email-provided',
          "Creación de Usuario vía Auth0",
          `Usuario creado automáticamente: ${auth0User.name || 'Usuario'} (${auth0User.email || 'no-email-provided'})`
        );
      }
    } else {
      // Actualizar información básica del usuario si ha cambiado en Auth0
      const updates: any = {};
      if (auth0User.name && auth0User.name !== dbUser.name) {
        updates.name = auth0User.name;
      }
      if (auth0User.email && auth0User.email !== dbUser.email) {
        updates.email = auth0User.email;
      }
      if (auth0User.picture && auth0User.picture !== dbUser.avatarUrl) {
        updates.avatarUrl = auth0User.picture;
      }

      if (Object.keys(updates).length > 0) {
        dbUser = await prisma.user.update({
          where: { id: auth0User.sub },
          data: updates,
        });

        // Registrar el evento de actualización
        await logAuditEvent(
          auth0User.email || dbUser.email,
          "Actualización de Perfil vía Auth0",
          `Perfil actualizado: ${dbUser.name} (${dbUser.email})`
        );
      }
    }

    // Excluimos campos sensibles
    const { password, ...userToReturn } = dbUser;

    return res.status(200).json(userToReturn);
  } catch (error) {
    console.error('Error en API user-profile:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 
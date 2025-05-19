
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Users, UserCog } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function UserRow({ user }: { user: User }) {
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="avatar perfil" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          {user.name}
        </div>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
          {user.role === "Admin" ? "Administrador" : "Usuario"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm">
          <UserCog className="mr-2 h-4 w-4" />
          Gestionar
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function UserManagementPage() {
  const { role, getAllUsers } = useAuth();
  const users = getAllUsers ? getAllUsers() : [];

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Acceso Denegado</AlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a la Gestión de Usuarios. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Users className="mr-3 h-8 w-8 text-primary" />Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Gestionar usuarios, roles y permisos.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Ver y gestionar todos los usuarios del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold">No hay usuarios para mostrar.</p>
              <p className="text-sm text-muted-foreground">Actualmente no hay usuarios registrados en el sistema.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

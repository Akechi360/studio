
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Bug } from 'lucide-react';

export default function FallasPage() {
  const { user } = useAuth();

  const canAccessModule =
    user &&
    (user.role === "Admin" ||
      user.role === "Presidente IEQ" ||
      user.email === "electromedicina@clinicaieq.com");

  if (!canAccessModule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <RadixAlertTitle className="text-xl font-bold">Acceso Denegado</RadixAlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder al módulo de Gestión de Fallas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Bug className="mr-3 h-8 w-8 text-primary" />
            Gestión de Fallas
          </h1>
          <p className="text-muted-foreground">
            Módulo para el reporte y seguimiento de fallas de equipos. (En Desarrollo)
          </p>
        </div>
      </div>

      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Listado de Fallas</CardTitle>
          <CardDescription>
            Aquí se mostrarán las fallas reportadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Bug className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Módulo en Construcción</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              La funcionalidad completa para la gestión de fallas se implementará próximamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

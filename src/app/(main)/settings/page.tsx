
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const { role } = useAuth();

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Acceso Denegado</AlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a Configuración. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><SettingsIcon className="mr-3 h-8 w-8 text-primary" />Configuración</h1>
        <p className="text-muted-foreground">
          Configurar ajustes y preferencias de la aplicación.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configuración de la Aplicación</CardTitle>
          <CardDescription>Gestionar ajustes globales para la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Las opciones de configuración estarán disponibles aquí. Podrías gestionar cosas como preferencias de notificación, integraciones u otros ajustes a nivel de sistema.</p>
          <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
            <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="font-semibold">Las opciones de configuración aparecerán aquí.</p>
            <p className="text-sm text-muted-foreground">Aquí es donde se gestionarán diversos ajustes de la aplicación.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

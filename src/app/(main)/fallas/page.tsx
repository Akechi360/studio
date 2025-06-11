"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Bug, Printer } from 'lucide-react';
import { useState } from 'react';
import FallaList from '@/components/fallas/FallaList';
import { Button } from '@/components/ui/button';
import { CreateFallaDialog } from '@/components/fallas/CreateFallaDialog';

export default function FallasPage() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filtros, setFiltros] = useState({});

  const canAccessModule =
    user &&
    (user.role === "Admin" ||
      user.role === "Presidente" ||
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

  // Handler para imprimir (puedes personalizarlo)
  function handlePrint() {
    window.print();
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
            Administra y supervisa los reportes de fallas de equipos médicos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="shadow-md"
          >
            + Reportar Falla
          </Button>
          <Button
            onClick={handlePrint}
            size="lg"
            variant="secondary"
            className="shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
          >
            <Printer className="h-5 w-5" />
            <span>Imprimir</span>
          </Button>
        </div>
      </div>
      <CreateFallaDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} onFallaCreated={() => window.location.reload()} />
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Lista de Fallas</CardTitle>
          <CardDescription>
            Casos reportados y en seguimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FallaList filtros={filtros} />
        </CardContent>
      </Card>
    </div>
  );
}

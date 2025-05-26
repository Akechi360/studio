
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wrench, PlusCircle, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import type { Falla } from '@/lib/types';
import { getAllFallasAction } from '@/lib/actions'; // We'll create this action
import { CreateFallaDialog } from '@/components/fallas/CreateFallaDialog'; // We'll create this component
import { useToast } from '@/hooks/use-toast';

// Placeholder for actual FallaListItem component
function FallaListItemPlaceholder({ falla }: { falla: Falla }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{falla.subject}</CardTitle>
        <CardDescription>ID: {falla.id} - Estado: {falla.currentStatus}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{falla.description}</p>
        <p className="text-xs mt-2">Reportado por: {falla.reportedByUserName} el {new Date(falla.reportedAt).toLocaleDateString()}</p>
        <p className="text-xs">Ubicación: {falla.location}</p>
      </CardContent>
    </Card>
  );
}

export default function FallasPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [fallas, setFallas] = useState<Falla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const canManageFallas = user?.email === "electromedicina@clinicaieq.com";
  const canViewFallas = role === 'Admin' || role === 'Presidente IEQ' || canManageFallas;

  const fetchFallas = async () => {
    if (!canViewFallas) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const fetchedFallas = await getAllFallasAction();
      setFallas(fetchedFallas);
    } catch (error) {
      console.error("Error fetching fallas:", error);
      toast({ title: "Error", description: "No se pudieron cargar las fallas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFallas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);


  if (!canViewFallas) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <RadixAlertTitle className="text-xl font-bold">Acceso Denegado</RadixAlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a la Gestión de Fallas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleFallaCreated = () => {
    setIsCreateDialogOpen(false);
    fetchFallas(); // Refresh the list
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Wrench className="mr-3 h-8 w-8 text-primary" />
            Gestión de Fallas Técnicas
          </h1>
          <p className="text-muted-foreground">
            Centraliza el seguimiento y reporte de problemas técnicos y mantenimientos.
          </p>
        </div>
        {(canManageFallas || role === 'Admin') && (
          <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="mr-2 h-5 w-5" />
            Reportar Nueva Falla
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
          <span>Cargando reportes de fallas...</span>
        </div>
      ) : fallas.length === 0 ? (
        <Card className="shadow-md text-center py-12">
          <CardContent>
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No hay fallas reportadas</h3>
            <p className="text-muted-foreground mt-2">
              {(canManageFallas || role === 'Admin') ? "Puedes reportar una nueva falla usando el botón de arriba." : "Actualmente no hay fallas para mostrar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fallas.map(falla => (
            <FallaListItemPlaceholder key={falla.id} falla={falla} />
            // Replace FallaListItemPlaceholder with the actual component once created
          ))}
        </div>
      )}
      
      {user && (canManageFallas || role === 'Admin') && (
        <CreateFallaDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={handleFallaCreated}
          currentUser={user}
        />
      )}
    </div>
  );
}

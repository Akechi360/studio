// src/app/(main)/mantenimiento/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import { Wrench, PlusCircle, ShieldAlert, Loader2, Eye, CalendarClock, ListFilter, ServerCrash, Printer } from 'lucide-react'; // Added Printer icon
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CasoDeMantenimiento, CasoMantenimientoStatus, CasoMantenimientoPriority, CasoMantenimientoLogEntry } from '@/lib/types';
import { getAllCasosMantenimientoAction } from '@/lib/actions';
import { CreateCasoMantenimientoDialog } from '@/components/mantenimiento/CreateCasoMantenimientoDialog';
import { Loading } from '@/components/ui/loading';

const statusColors: Record<CasoMantenimientoStatus, string> = {
  'Registrado': "bg-blue-500",
  'PendientePresupuesto': "bg-yellow-500 text-black",
  'PresupuestoAprobado': "bg-teal-500",
  'EnServicioReparacion': "bg-orange-500",
  'PendienteRespaldo': "bg-purple-500",
  'Resuelto': "bg-green-500",
  'Cancelado': "bg-gray-500",
};

const priorityColors: Record<CasoMantenimientoPriority, string> = {
  'Baja': "border-green-500 text-green-700 bg-green-50",
  'Media': "border-yellow-500 text-yellow-700 bg-yellow-50",
  'Alta': "border-orange-500 text-orange-700 bg-orange-50",
  'Critica': "border-red-500 text-red-700 bg-red-50",
};


export default function MantenimientoPage() {
  const { user, role } = useAuth();
  const [casos, setCasos] = useState<CasoDeMantenimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const canAccessModule = user && (role === 'Admin' || role === 'Presidente' || user.email === 'electromedicina@clinicaieq.com');
  const canCreateOrEdit = user && (role === 'Admin' || user.email === 'electromedicina@clinicaieq.com');

  const fetchCasos = useCallback(async () => {
    if (!canAccessModule) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedCasos = await getAllCasosMantenimientoAction();
      setCasos(fetchedCasos);
    } catch (error) {
      console.error("Error fetching maintenance cases:", error);
    } finally {
      setIsLoading(false);
    }
  }, [canAccessModule]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  if (!canAccessModule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <RadixAlertTitle className="text-xl font-bold">Acceso Denegado</RadixAlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a la Gestión de Mantenimiento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleCasoCreated = () => {
    fetchCasos();
    setIsCreateDialogOpen(false);
  };

  const getMostRecentLogDate = (logs: CasoMantenimientoLogEntry[]): Date | null => {
    if (!logs || logs.length === 0) return null;
    return logs.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest).timestamp;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Wrench className="mr-3 h-8 w-8 text-primary" />
            Gestión de Mantenimiento
          </h1>
          <p className="text-muted-foreground">
            Administra y supervisa los casos de mantenimiento con proveedores externos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {canCreateOrEdit && (
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <PlusCircle className="mr-2 h-5 w-5" />
                Registrar Nuevo Caso
            </Button>
            )}
            {/* Botón de Imprimir */}
            <Button onClick={handlePrint} size="lg" variant="secondary" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <Printer className="mr-2 h-5 w-5" />
                Imprimir
            </Button>
        </div>
      </div>

      {/* Placeholder for Role-Specific Summary Cards (Admin/Presidente) - Future implementation */}
      {/* Placeholder for Filters - Future implementation */}
      {/* <Card className="shadow-md">
        <CardHeader><CardTitle className="text-lg flex items-center"><ListFilter className="mr-2 h-5 w-5 text-primary"/>Filtros</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Filtros por estado, proveedor y prioridad se implementarán aquí.</p></CardContent>
      </Card> */}


      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Lista de Casos de Mantenimiento</CardTitle>
          <CardDescription>
            {canCreateOrEdit ? "Casos registrados y en seguimiento." : "Supervisión de casos de mantenimiento."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading message="Cargando casos de mantenimiento..." variant="circles" size="md" />
          ) : casos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <ServerCrash className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No Hay Casos Registrados</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Actualmente no hay casos de mantenimiento en el sistema.
                {canCreateOrEdit && " Puedes registrar uno nuevo."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Proveedor</TableHead>
                  {canCreateOrEdit && <TableHead>Próx. Seguimiento</TableHead>}
                  <TableHead>Últ. Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {casos.map((caso) => {
                  const lastLogDate = getMostRecentLogDate(caso.log);
                  const isNextFollowUpDue = caso.nextFollowUpDate && new Date(caso.nextFollowUpDate) <= new Date();
                  return (
                    <TableRow key={caso.id}>
                      <TableCell className="font-medium">{caso.title}</TableCell>
                      <TableCell>{caso.location}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[caso.priority]}>{caso.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${statusColors[caso.currentStatus]}`}>{caso.currentStatus}</Badge>
                      </TableCell>
                      <TableCell>{caso.assignedProviderName}</TableCell>
                      {canCreateOrEdit && (
                        <TableCell className={isNextFollowUpDue ? "text-destructive font-semibold" : ""}>
                          {caso.nextFollowUpDate ? format(new Date(caso.nextFollowUpDate), "PP", { locale: es }) : 'N/A'}
                          {isNextFollowUpDue && <CalendarClock className="inline ml-1 h-4 w-4" />}
                        </TableCell>
                      )}
                      <TableCell>
                        {lastLogDate ? formatDistanceToNow(new Date(lastLogDate), { addSuffix: true, locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/mantenimiento/${caso.id}`}>
                            <Eye className="mr-1.5 h-4 w-4" /> Ver
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {user && (
          <CreateCasoMantenimientoDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onCasoCreated={handleCasoCreated}
            currentUser={user}
          />
      )}
    </div>
  );
}
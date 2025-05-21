
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ClipboardList, UserCheck, History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Placeholder data for audit logs
const placeholderLogs = [
  { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'sistemas@clinicaieq.com', action: 'Usuario "juan.perez@example.com" creado.', details: 'Rol: Usuario, Departamento: Admisión' },
  { id: '2', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'sistemas@clinicaieq.com', action: 'Ticket #TICK-001 actualizado.', details: 'Estado cambiado a "En Progreso"' },
  { id: '3', timestamp: new Date(Date.now() - 10800000).toISOString(), user: 'ana.gomez@example.com', action: 'Nuevo comentario en Ticket #TICK-002.', details: 'Comentario: "Solución aplicada."' },
];


export default function AuditLogPage() {
  const { role } = useAuth();

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Acceso Denegado</AlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder al Historial de Auditoría. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <ClipboardList className="mr-3 h-8 w-8 text-primary" />
          Historial de Auditoría / Logs de Actividad
        </h1>
        <p className="text-muted-foreground">
          Registro detallado de todas las acciones importantes realizadas en el sistema.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Registros de Actividad del Sistema</CardTitle>
          <CardDescription>
            Monitoriza quién hizo qué y cuándo. Utiliza los filtros para encontrar eventos específicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Input placeholder="Buscar por usuario o acción..." className="max-w-xs" />
            <Input type="date" placeholder="Fecha Desde" className="max-w-xs" />
            <Input type="date" placeholder="Fecha Hasta" className="max-w-xs" />
            <Button variant="outline"><Search className="mr-2 h-4 w-4" /> Filtrar</Button>
          </div>
          
          {placeholderLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Detalles Adicionales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold">No hay registros de auditoría disponibles.</p>
              <p className="text-sm text-muted-foreground">La actividad del sistema se registrará aquí.</p>
            </div>
          )}

          <Alert className="mt-8">
            <UserCheck className="h-4 w-4" />
            <AlertTitle>Funcionalidad de Registro Real</AlertTitle>
            <AlertDescription>
              Esta es una visualización de ejemplo. En un sistema real, los eventos se registrarían automáticamente a medida que ocurren.
              La implementación completa del guardado y filtrado de logs está pendiente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

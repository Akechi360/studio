
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ClipboardList, UserCheck, History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from 'react'; // Import useState and useEffect

// Interface for AuditLog (adapt as needed when implementing actual logging)
interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  user: string; // email or user ID/name
  action: string;
  details?: string;
}

// Initially empty logs, to be populated by actual system activity logging
const initialLogs: AuditLogEntry[] = [];


export default function AuditLogPage() {
  const { role } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialLogs);
  // Add useEffect or other logic here to fetch/subscribe to actual logs when implemented

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
          
          {auditLogs.length > 0 ? (
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
                {auditLogs.map((log) => (
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
              <p className="text-sm text-muted-foreground">La actividad importante del sistema se registrará aquí cuando se implemente la funcionalidad de auditoría.</p>
            </div>
          )}
          {/* Alert for real logging functionality removed */}
        </CardContent>
      </Card>
    </div>
  );
}


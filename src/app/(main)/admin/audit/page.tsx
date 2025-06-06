
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ClipboardList, History, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '@/lib/actions'; // Import server action to get logs
import type { AuditLogEntry as AuditLogEntryPrismaType } from '@prisma/client';

// Interface for AuditLog moved to mock-data.ts for consistency
// interface AuditLogEntry {
//   id: string;
//   timestamp: string; // ISO string
//   user: string; // email or user ID/name
//   action: string;
//   details?: string;
// }

const initialLogs: AuditLogEntryPrismaType[] = [];

export default function AuditLogPage() {
  const { role } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntryPrismaType[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const logsFromServer = await getAuditLogs(); // Esto devuelve AuditLogEntryPrismaType[]
      setAuditLogs(logsFromServer); // Asignación directa
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "Admin") {
      fetchAuditLogs();
    }
  }, [role, fetchAuditLogs]);

  const filteredLogs = auditLogs.filter(log => {
    // log ahora es de tipo AuditLogEntryPrismaType
    // log.timestamp de Prisma es un objeto Date
    const logDate = log.timestamp; // No es necesario new Date() si ya es un objeto Date
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : null;

    const searchTermLower = searchTerm.toLowerCase();
    
    // ***** PUNTO CLAVE DE CORRECCIÓN: Lógica de Filtrado *****
    // Se usa log.userEmail en lugar de log.user
    const matchesSearchTerm = (
      (log.userEmail && log.userEmail.toLowerCase().includes(searchTermLower)) ||
      log.action.toLowerCase().includes(searchTermLower) ||
      (log.details && log.details.toLowerCase().includes(searchTermLower))
    );

    return (
      matchesSearchTerm &&
      (!fromDate || logDate >= fromDate) &&
      (!toDate || logDate <= toDate)
    );
  });

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
            <Input 
              placeholder="Buscar por usuario (email), acción o detalle..."
              className="max-w-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Input 
              type="date" 
              placeholder="Fecha Desde" 
              className="max-w-xs"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input 
              type="date" 
              placeholder="Fecha Hasta" 
              className="max-w-xs" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Cargando registros de auditoría...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Usuario (Email)</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Detalles Adicionales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => ( // log aquí es AuditLogEntryPrismaType
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    {/* ***** PUNTO CLAVE DE CORRECCIÓN: Renderizado en Tabla ***** */}
                    {/* Se usa log.userEmail en lugar de log.user */}
                    <TableCell>{log.userEmail}</TableCell> 
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={log.details || undefined}>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold">
                {auditLogs.length === 0 ? "No hay registros de auditoría disponibles." : "No se encontraron registros con los filtros aplicados."}
              </p>
              <p className="text-sm text-muted-foreground">
                {auditLogs.length === 0 ? "La actividad importante del sistema se registrará aquí." : "Intenta ajustar tus filtros."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
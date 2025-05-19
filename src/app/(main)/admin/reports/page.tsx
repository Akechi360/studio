
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, BarChart3, Ticket, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/actions';
import type { TicketSummary, TicketStats } from '@/lib/types';
import { TicketStatsCharts } from '@/components/dashboard/ticket-stats-charts'; 
import { Loader2 } from 'lucide-react';

function StatCard({ title, value, icon, description, colorClass = "text-primary" }: { title: string, value: string | number, icon: React.ElementType, description: string, colorClass?: string }) {
  const IconComponent = icon;
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}


export default function ReportsPage() {
  const { role } = useAuth();
  const [statsData, setStatsData] = useState<{ summary: TicketSummary; stats: TicketStats } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (role === "Admin") {
      const fetchStats = async () => {
        setIsLoading(true);
        const data = await getDashboardStats();
        setStatsData(data);
        setIsLoading(false);
      };
      fetchStats();
    }
  }, [role]);

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Acceso Denegado</AlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a Reportes. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Cargando reportes...</p>
      </div>
    );
  }

  if (!statsData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="font-semibold">No hay datos de reportes disponibles.</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><BarChart3 className="mr-3 h-8 w-8 text-primary" />Reportes</h1>
        <p className="text-muted-foreground">
          Ver reportes y analíticas del sistema.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Analíticas del Sistema</CardTitle>
          <CardDescription>Generar y ver varios reportes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Tickets Totales" value={statsData.summary.total} icon={Ticket} description="Todos los tickets creados" />
            <StatCard title="Tickets Abiertos" value={statsData.summary.open} icon={AlertTriangle} description="Tickets que necesitan atención" colorClass="text-destructive" />
            <StatCard title="En Progreso" value={statsData.summary.inProgress} icon={Clock} description="Tickets en los que se está trabajando actualmente" colorClass="text-yellow-500" />
            <StatCard title="Tickets Resueltos/Cerrados" value={statsData.summary.resolved + statsData.summary.closed} icon={CheckCircle} description="Tickets resueltos o cerrados exitosamente" colorClass="text-green-500" />
          </div>
          
          {statsData.summary.total > 0 ? (
             <TicketStatsCharts stats={statsData.stats} />
          ) : (
            <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold">No hay datos de tickets para graficar.</p>
              <p className="text-sm text-muted-foreground">Crea algunos tickets para ver los gráficos aquí.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

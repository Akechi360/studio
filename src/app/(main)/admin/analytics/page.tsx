
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, BarChartBig, TrendingUp, Clock, Users2, PieChart as PieChartLucide, FileDown, AlertTriangle, Ticket, CheckCircle } from 'lucide-react'; // Renamed PieChart to PieChartLucide
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

export default function AnalyticsPage() {
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
            No tienes permiso para acceder a Analíticas Avanzadas. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <BarChartBig className="mr-3 h-8 w-8 text-primary" />
          Analíticas del Sistema de Tickets
        </h1>
        <p className="text-muted-foreground">
          Resumen del rendimiento actual y funcionalidades de análisis avanzado planeadas.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Cargando datos de analíticas...</p>
        </div>
      )}

      {!isLoading && statsData && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Resumen de Tickets Actual</CardTitle>
              <CardDescription>Estadísticas generales del sistema de tickets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Tickets Totales" value={statsData.summary.total} icon={Ticket} description="Todos los tickets creados" />
                <StatCard title="Tickets Abiertos" value={statsData.summary.open} icon={AlertTriangle} description="Tickets que necesitan atención" colorClass="text-destructive" />
                <StatCard title="En Progreso" value={statsData.summary.inProgress} icon={Clock} description="Tickets en los que se está trabajando actualmente" colorClass="text-yellow-500" />
                <StatCard title="Resueltos/Cerrados" value={statsData.summary.resolved + statsData.summary.closed} icon={CheckCircle} description="Tickets completados exitosamente" colorClass="text-green-500" />
              </div>
              {statsData.summary.total > 0 ? (
                <TicketStatsCharts stats={statsData.stats} />
              ) : (
                <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
                  <BarChartBig className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold">No hay datos de tickets para graficar.</p>
                  <p className="text-sm text-muted-foreground">Crea algunos tickets para ver los gráficos aquí.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {!isLoading && !statsData && role === "Admin" && (
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Resumen de Tickets Actual</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center min-h-[200px] p-4 text-center">
                    <BarChartBig className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="font-semibold">No hay datos de reportes disponibles actualmente.</p>
                    <p className="text-sm text-muted-foreground">Los datos aparecerán aquí una vez que haya actividad en el sistema.</p>
                </div>
            </CardContent>
         </Card>
      )}


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Analíticas Avanzadas Planeadas</CardTitle>
          <CardDescription>
            Funcionalidades detalladas y personalizables para una toma de decisiones informada que se implementarán a futuro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon={TrendingUp}
              title="Tendencias de Tickets"
              description="Visualiza la creación de tickets por día, semana o mes para identificar patrones."
            />
            <InfoCard
              icon={Clock}
              title="Tiempos de Respuesta y Resolución"
              description="Analiza el tiempo promedio de primera respuesta y el tiempo total de resolución de tickets."
            />
            <InfoCard
              icon={Users2}
              title="Data Detallada de Tickets"
              description="Analiza métricas detalladas de tickets, incluyendo asignaciones, progresos y otros KPIs relevantes (funcionalidad futura)."
            />
            <InfoCard
              icon={PieChartLucide}
              title="Distribución de Tickets"
              description="Desglosa los tickets por categoría, prioridad, estado, departamento, etc."
            />
            <InfoCard
              icon={FileDown}
              title="Exportación de Datos"
              description="Opción para exportar los datos de los reportes en formatos como CSV o PDF."
            />
             <InfoCard
              icon={BarChartBig} // Using BarChartBig as BarChart is also a component name
              title="Gráficos Interactivos"
              description="Presentación de datos mediante gráficos dinámicos y fáciles de interpretar."
            />
          </div>
           <Alert className="mt-6 border-primary/50 bg-primary/5">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold text-primary">En Desarrollo</AlertTitle>
            <AlertDescription className="text-primary/80">
              Las funcionalidades de analíticas avanzadas detalladas aquí están planificadas y se implementarán en futuras actualizaciones del sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg shadow-sm bg-muted/30 hover:shadow-md transition-shadow">
      <Icon className="h-8 w-8 text-primary mt-1 shrink-0" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

    
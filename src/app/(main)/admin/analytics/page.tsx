
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, BarChartBig, TrendingUp, Clock, Users2, PieChart, FileDown } from 'lucide-react';

export default function AnalyticsPage() {
  const { role } = useAuth();

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
          Informes y Analíticas Avanzadas
        </h1>
        <p className="text-muted-foreground">
          Análisis detallado del rendimiento del sistema de tickets y tendencias.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Funcionalidades Planeadas</CardTitle>
          <CardDescription>
            Esta sección ofrecerá reportes detallados y personalizables para una toma de decisiones informada.
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
              title="Rendimiento por Agente/Equipo"
              description="Mide los tickets resueltos y pendientes por agente o equipo (funcionalidad futura)."
            />
            <InfoCard
              icon={PieChart}
              title="Distribución de Tickets"
              description="Desglosa los tickets por categoría, prioridad, estado, departamento, etc."
            />
            <InfoCard
              icon={FileDown}
              title="Exportación de Datos"
              description="Opción para exportar los datos de los reportes en formatos como CSV o PDF."
            />
             <InfoCard
              icon={BarChartBig}
              title="Gráficos Interactivos"
              description="Presentación de datos mediante gráficos dinámicos y fáciles de interpretar."
            />
          </div>
           <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>En Desarrollo</AlertTitle>
            <AlertDescription>
              Las funcionalidades de analíticas avanzadas están planificadas y se implementarán en futuras actualizaciones.
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

// Placeholder for AlertTriangle if not imported elsewhere, or ensure it's imported from lucide-react
const AlertTriangle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
);

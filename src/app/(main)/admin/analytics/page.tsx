// src/app/(main)/admin/analytics/page.tsx
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, BarChartBig, TrendingUp, Clock, Users2, PieChart as PieChartLucide, FileDown, AlertTriangle, Ticket, CheckCircle, Printer } from 'lucide-react'; // Renamed PieChart to PieChartLucide, Added Printer icon
import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { getDashboardStats } from '@/lib/actions';
import type { TicketSummary } from '@/lib/types';
import type { TicketStats } from '@/lib/types/ticket-stats';
import { TicketStatsCharts } from '@/components/dashboard/ticket-stats-charts';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTicketStats } from "@/lib/services/ticket-stats";
import { AlertCircle } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string;
}

const StatCard = memo(({ title, value, icon: Icon, colorClass = "text-primary" }: StatCardProps) => (
  <Card className="shadow-ammie rounded-2xl backdrop-blur-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

const InfoCard = memo(({ title, description }: { title: string; description: string }) => (
  <Card className="shadow-ammie rounded-2xl backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
));

InfoCard.displayName = 'InfoCard';

const LoadingSkeleton = memo(() => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="h-[120px] rounded-2xl" />
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

const ErrorDisplay = memo(({ error }: { error: string }) => (
  <div className="flex items-center justify-center p-6 bg-destructive/10 rounded-2xl">
    <AlertCircle className="h-5 w-5 text-destructive mr-2" />
    <p className="text-destructive">{error}</p>
  </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

const NoDataDisplay = memo(() => (
  <div className="flex items-center justify-center p-6 bg-muted/10 rounded-2xl">
    <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
    <p className="text-muted-foreground">No hay datos disponibles para mostrar.</p>
  </div>
));

NoDataDisplay.displayName = 'NoDataDisplay';

const StatsGrid = memo(({ statsData }: { statsData: TicketStats }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <StatCard
      title="Tickets Totales"
      value={statsData.summary.total}
      icon={Ticket}
    />
    <StatCard
      title="Tickets Abiertos"
      value={statsData.summary.abierto}
      icon={AlertCircle}
      colorClass="text-destructive"
    />
    <StatCard
      title="En Progreso"
      value={statsData.summary.enProgreso}
      icon={Clock}
      colorClass="text-yellow-500"
    />
    <StatCard
      title="Resueltos/Cerrados"
      value={statsData.summary.resuelto + statsData.summary.cerrado}
      icon={CheckCircle}
      colorClass="text-green-500"
    />
  </div>
));

StatsGrid.displayName = 'StatsGrid';

const ChartsSection = memo(({ statsData }: { statsData: TicketStats }) => {
  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }, []);

  const getCategoryDescription = useCallback((categoryDistribution: TicketStats['categoryDistribution']) => {
    if (!categoryDistribution.length) return 'No hay datos disponibles';
    
    return categoryDistribution
      .map((cat: { category: string; percentage: number }) => `${cat.category} (${cat.percentage}%)`)
      .join(', ');
  }, []);

  const categoryDescription = useMemo(() => 
    getCategoryDescription(statsData.categoryDistribution),
    [statsData.categoryDistribution, getCategoryDescription]
  );

  const resolutionTime = useMemo(() => 
    formatTime(statsData.resolutionTime.average),
    [statsData.resolutionTime.average, formatTime]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4 shadow-ammie-lg rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Distribución de Tickets</CardTitle>
      </CardHeader>
      <CardContent>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <TicketStatsCharts stats={statsData.stats} />
          </Suspense>
      </CardContent>
    </Card>

      <div className="col-span-3 space-y-4">
        <InfoCard
          title="Tickets por Categoría"
          description={categoryDescription}
        />
        <InfoCard
          title="Tiempo de Resolución"
          description={`Tiempo promedio de resolución: ${resolutionTime}`}
        />
      </div>
    </div>
  );
});

ChartsSection.displayName = 'ChartsSection';

const TRENDS_EXAMPLE = [
  { x: 0, y: 2100 },
  { x: 2.5, y: 3200 },
  { x: 5, y: 6100 },
  { x: 7.5, y: 4200 },
  { x: 10, y: 3900 },
  { x: 12.5, y: 6500 },
  { x: 15, y: 4800 },
  { x: 17.5, y: 6700 },
  { x: 20, y: 5100 },
  { x: 22.5, y: 4300 },
  { x: 25, y: 6600 },
];

const TrendsSection = memo(() => (
  <Card className="shadow-ammie-lg rounded-2xl backdrop-blur-sm">
    <CardHeader>
      <CardTitle>Tendencias de Tickets Creados</CardTitle>
      <CardDescription>Visualiza la evolución de tickets creados en el tiempo.</CardDescription>
    </CardHeader>
    <CardContent>
      <TicketStatsCharts stats={{ byStatus: [], byPriority: [], byCategory: [], trends: TRENDS_EXAMPLE }} type="line" />
    </CardContent>
  </Card>
));

TrendsSection.displayName = 'TrendsSection';

export default function AnalyticsPage() {
  const { role } = useAuth();
  const [statsData, setStatsData] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      const fetchStats = async () => {
      try {
        const data = await getTicketStats();
        setStatsData({
          ...data,
          stats: {
            byStatus: data.stats.byStatus.map(item => ({ name: item.name, value: item.value })),
            byPriority: data.stats.byPriority.map(item => ({ name: item.name, value: item.value })),
            byCategory: data.stats.byCategory.map(item => ({ name: item.name, value: item.value }))
          }
        });
      } catch (err) {
        setError('Error al cargar las estadísticas. Por favor, intente nuevamente más tarde.');
        console.error('Error al cargar estadísticas:', err);
      } finally {
        setIsLoading(false);
      }
      };

      fetchStats();
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Análisis de Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y analiza el rendimiento de los tickets del sistema
          </p>
        </div>
          <Button
          variant="outline" 
          className="shadow-ammie rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={handlePrint}
          >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Reporte
          </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : !statsData ? (
        <NoDataDisplay />
      ) : (
        <>
          <StatsGrid statsData={statsData} />
          <ChartsSection statsData={statsData} />
          <TrendsSection />
        </>
      )}
    </div>
  );
}


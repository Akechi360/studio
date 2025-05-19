
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { getDashboardStats } from "@/lib/actions";
import { TicketStatsCharts } from "@/components/dashboard/ticket-stats-charts";
import type { TicketSummary, TicketStats } from "@/lib/types";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

function StatCard({ title, value, icon, description, colorClass = "text-primary" }: { title: string, value: string | number, icon: React.ElementType, description: string, colorClass?: string }) {
  const IconComponent = icon;
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const { summary, stats } = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">
          ¡Bienvenido! Aquí tienes un resumen de tus tickets de soporte.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tickets Totales" value={summary.total} icon={Ticket} description="Todos los tickets creados" />
        <StatCard title="Tickets Abiertos" value={summary.open} icon={AlertTriangle} description="Tickets que necesitan atención" colorClass="text-destructive" />
        <StatCard title="En Progreso" value={summary.inProgress} icon={Clock} description="Tickets en los que se está trabajando" colorClass="text-yellow-500" />
        <StatCard title="Tickets Resueltos" value={summary.resolved + summary.closed} icon={CheckCircle} description="Tickets resueltos o cerrados exitosamente" colorClass="text-green-500" />
      </div>

      <TicketStatsCharts stats={stats} />
      
    </div>
  );
}

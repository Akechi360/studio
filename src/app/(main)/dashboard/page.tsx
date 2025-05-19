
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { getDashboardStats } from "@/lib/actions";
import { TicketStatsCharts } from "@/components/dashboard/ticket-stats-charts";
import type { TicketSummary, TicketStats } from "@/lib/types";

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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome! Here&apos;s an overview of your support tickets.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tickets" value={summary.total} icon={Ticket} description="All tickets created" />
        <StatCard title="Open Tickets" value={summary.open} icon={AlertTriangle} description="Tickets needing attention" colorClass="text-destructive" />
        <StatCard title="In Progress" value={summary.inProgress} icon={Clock} description="Tickets currently being worked on" colorClass="text-yellow-500" />
        <StatCard title="Resolved Tickets" value={summary.resolved + summary.closed} icon={CheckCircle} description="Tickets successfully resolved or closed" colorClass="text-green-500" />
      </div>

      <TicketStatsCharts stats={stats} />
      
    </div>
  );
}

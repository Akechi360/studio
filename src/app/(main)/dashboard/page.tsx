
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket, CheckCircle, AlertTriangle, Clock, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { getDashboardStats } from "@/lib/actions";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';
import type { TicketSummary, TicketStats } from "@/lib/types";

const COLORS_PRIORITY = ['#00C49F', '#FFBB28', '#FF8042']; // Green, Yellow, Orange/Red
const COLORS_STATUS = ['#3399FF', '#FFBB28', '#00C49F', '#8884d8']; // Blue, Yellow, Green, Gray/Purple


async function TicketStatsCharts({ stats }: { stats: TicketStats }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" />Tickets by Priority</CardTitle>
          <CardDescription>Distribution of tickets based on their priority level.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byPriority}>
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{color: "hsl(var(--foreground))"}}/>
              <Bar dataKey="value" name="Tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary" />Tickets by Status</CardTitle>
          <CardDescription>Current status overview of all tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.byStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                stroke="hsl(var(--background))"
              >
                {stats.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{color: "hsl(var(--foreground))"}}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

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

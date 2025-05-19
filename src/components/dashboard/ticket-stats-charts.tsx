
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';
import type { TicketStats } from "@/lib/types";

const COLORS_STATUS = ['#3399FF', '#FFBB28', '#00C49F', '#8884d8']; // Azul, Amarillo, Verde, Gris/Púrpura

export function TicketStatsCharts({ stats }: { stats: TicketStats }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" />Tickets por Prioridad</CardTitle>
          <CardDescription>Distribución de tickets según su nivel de prioridad.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.byPriority.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No hay datos de prioridad para mostrar.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byPriority}>
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend wrapperStyle={{color: "hsl(var(--foreground))"}} formatter={(value) => <span className="text-foreground">{value}</span>} />
                <Bar dataKey="value" name="Tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary" />Tickets por Estado</CardTitle>
          <CardDescription>Resumen del estado actual de todos los tickets.</CardDescription>
        </CardHeader>
        <CardContent>
         {stats.byStatus.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No hay datos de estado para mostrar.</p>
            </div>
          ) : (
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
                <Legend wrapperStyle={{color: "hsl(var(--foreground))"}} formatter={(value) => <span className="text-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

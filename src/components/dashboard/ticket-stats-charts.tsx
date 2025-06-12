"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { TicketStats } from "@/lib/types/ticket-stats";
import { BarChart as RechartsBarChart, CartesianGrid } from 'recharts';
import { memo, useMemo, useCallback } from 'react';

// Colores actualizados para coincidir con Ammie
const COLORS_STATUS = [
  'hsl(var(--primary))', // Color primario
  'hsl(var(--chart-2))', // Púrpura
  'hsl(var(--chart-3))', // Verde
  'hsl(var(--chart-4))', // Naranja
];

const COLORS_PRIORITY = [
  'hsl(var(--destructive))', // Alta prioridad
  'hsl(var(--chart-4))',     // Media prioridad
  'hsl(var(--primary))',     // Baja prioridad
  'hsl(var(--muted))',       // Sin prioridad
];

// Gradientes para las barras
const BarGradient = memo(() => (
  <defs>
    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" /> {/* Azul */}
      <stop offset="100%" stopColor="#a78bfa" stopOpacity="1" /> {/* Morado */}
    </linearGradient>
  </defs>
));

BarGradient.displayName = 'BarGradient';

interface TicketStatsChartsProps {
  stats: {
    byStatus: Array<{ name: string; value: number }>;
    byPriority: Array<{ name: string; value: number }>;
    byCategory: Array<{ name: string; value: number }>;
    trends?: Array<{ x: number; y: number }>;
  };
  type?: 'bar' | 'pie' | 'line';
  aspect?: number;
}

const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-md p-3 shadow-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className="text-foreground">{`Cantidad: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

export const TicketStatsCharts = memo(function TicketStatsCharts({ stats, type = 'bar', aspect = 3 }: TicketStatsChartsProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  // --- BAR CHART ---
  const chartData = useMemo(() => {
    return stats.byStatus.map(item => ({
      name: item.name,
      value: item.value,
      formattedValue: item.value.toString()
    }));
  }, [stats.byStatus]);

  // --- LINE CHART ---
  const lineData = useMemo(() => {
    if (!stats.trends) return [];
    return stats.trends.map(item => ({ x: item.x, y: item.y }));
  }, [stats.trends]);

  // --- PIE CHART ---
  const pieData = useMemo(() => {
    return stats.byCategory.map(item => ({ name: item.name, value: item.value }));
  }, [stats.byCategory]);

  // DEPURACIÓN: Imprimir datos en consola
  // console.log('Datos para la gráfica:', chartData, lineData, pieData);

  // --- NO DATA ---
  const allZero = useMemo(() => chartData.every(item => item.value === 0), [chartData]);
  if (!chartData.length || allZero) {
  return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No hay datos disponibles
            </div>
    );
  }

  // --- BAR CHART RENDER ---
  if (type === 'bar') {
    // Dominio dinámico y robusto para el eje Y
    const maxValue = Math.max(...chartData.map(item => item.value), 1);
    // Ajuste para que la barra más alta llegue casi al borde superior
    const yDomain = [0, maxValue === 1 ? 3 : Math.ceil(maxValue * 1.05)];
    const formatYAxis = (value: number) => value.toString();
    return (
      <div className="h-[300px] w-full bg-card rounded-xl p-4">
        <ResponsiveContainer width="100%" aspect={2.2}>
          <BarChart 
            data={chartData} 
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            barCategoryGap={10}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="1" />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeWidth={1}
              vertical={false}
              opacity={0.7}
            />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 14 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 14 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              domain={yDomain}
              allowDecimals={false}
            />
                <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
            />
            <Bar 
              dataKey="value" 
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
              barSize={48}
              isAnimationActive={false}
            />
              </BarChart>
            </ResponsiveContainer>
      </div>
    );
  }

  // --- LINE CHART RENDER ---
  if (type === 'line') {
    // Eje X: ticks de 2.5 en 2.5, Eje Y: 0 a 7000, formato "k"
    const xTicks = Array.from({ length: 11 }, (_, i) => i * 2.5);
    const yTicks = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000];
    const formatYAxis = (value: number) => value === 0 ? '0' : `${value / 1000}k`;
    return (
      <div className="h-[300px] w-full bg-white rounded-xl p-4">
        <ResponsiveContainer width="100%" aspect={aspect}>
          <LineChart
            data={lineData}
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 25]}
              ticks={xTicks}
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 14 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={true}
            />
            <YAxis
              dataKey="y"
              domain={[0, 7000]}
              ticks={yTicks}
              stroke="hsl(var(--foreground))"
              tick={{ fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 14 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip
              contentStyle={{ fontSize: 14, fontFamily: 'inherit', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
              labelStyle={{ fontWeight: 600 }}
              itemStyle={{ color: 'hsl(var(--chart-6))' }}
              formatter={(value: number) => `${value}`}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="hsl(var(--chart-6))"
              strokeWidth={3}
              dot={{ r: 4, fill: 'hsl(var(--chart-6))', stroke: 'transparent' }}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-6))', stroke: 'hsl(var(--foreground))', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
            </div>
    );
  }

  // --- PIE CHART RENDER (placeholder, puedes expandirlo) ---
  if (type === 'pie') {
    return (
      <div className="h-[300px] w-full bg-white rounded-xl p-4 flex items-center justify-center">
        <ResponsiveContainer width="100%" aspect={aspect}>
              <PieChart>
                <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
                  cx="50%"
                  cy="50%"
              outerRadius={80}
              fill="hsl(var(--primary))"
              label
            >
              {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                  ))}
                </Pie>
            <Tooltip />
            <Legend />
              </PieChart>
            </ResponsiveContainer>
    </div>
  );
}

  // --- DEFAULT ---
  return null;
});

TicketStatsCharts.displayName = 'TicketStatsCharts';

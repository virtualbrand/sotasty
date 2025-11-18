'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge-2';
import { Card, CardContent, CardHeader } from '@/components/ui/card-2';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ArrowDown, ArrowUp, DollarSign, Users, Percent, TrendingUp } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

// Dados de métricas SaaS (últimos 18 dias)
const generateSaaSData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 17; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      mrr: 42000 + Math.random() * 5000 + (i * 150),
      customers: 170 + Math.floor(Math.random() * 20) + i,
      churn: 3 + Math.random() * 3,
      arr: (42000 + Math.random() * 5000 + (i * 150)) * 12,
    });
  }
  return data;
};

const saasData = generateSaaSData();

// Configuração de métricas
const metrics = [
  {
    key: 'mrr',
    label: 'MRR',
    value: 45200,
    previousValue: 42800,
    format: (val: number) => `R$ ${(val / 1000).toFixed(1)}k`,
    icon: DollarSign,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badgeColor: 'text-green-600',
    description: 'Receita Recorrente Mensal',
  },
  {
    key: 'customers',
    label: 'Clientes',
    value: 187,
    previousValue: 170,
    format: (val: number) => val.toFixed(0),
    icon: Users,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    badgeColor: 'text-teal-600',
    description: 'Assinantes ativos',
  },
  {
    key: 'churn',
    label: 'Churn Rate',
    value: 4.2,
    previousValue: 5.1,
    format: (val: number) => `${val.toFixed(1)}%`,
    isNegative: true, // Menor é melhor
    icon: Percent,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badgeColor: 'text-red-600',
    description: 'Taxa de cancelamento mensal',
  },
  {
    key: 'arr',
    label: 'ARR',
    value: 542400,
    previousValue: 513600,
    format: (val: number) => `R$ ${(val / 1000).toFixed(0)}k`,
    icon: DollarSign,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeColor: 'text-blue-600',
    description: 'Receita Recorrente Anual',
  },
];

// Cores do gráfico
const chartConfig = {
  mrr: {
    label: 'MRR',
    color: '#10b981',
  },
  customers: {
    label: 'Clientes',
    color: '#14b8a6',
  },
  churn: {
    label: 'Churn Rate',
    color: '#ef4444',
  },
  arr: {
    label: 'ARR',
    color: '#3b82f6',
  },
} satisfies ChartConfig;

// Tooltip customizado
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const metric = metrics.find((m) => m.key === entry.dataKey);

    if (metric) {
      return (
        <div className="rounded-lg border bg-popover p-3 shadow-sm shadow-black/5 min-w-[120px]">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-muted-foreground">{metric.label}:</span>
            <span className="font-semibold text-popover-foreground">{metric.format(entry.value)}</span>
          </div>
        </div>
      );
    }
  }
  return null;
};

export default function SaaSMetricsChart() {
  const [selectedMetric, setSelectedMetric] = useState<string>('mrr');

  return (
    <Card className="@container w-full bg-[var(--color-bg-app)] border-0">
      <CardHeader className="p-0 mb-5 border-0">
        {/* Metrics Grid */}
        <div className="grid @2xl:grid-cols-2 @3xl:grid-cols-4 grow gap-6">
          {metrics.map((metric) => {
            const change = ((metric.value - metric.previousValue) / metric.previousValue) * 100;
            const isPositive = metric.isNegative ? change < 0 : change > 0;
            const Icon = metric.icon;

            return (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={cn(
                  'bg-white rounded-xl p-6 border border-gray-200 text-start cursor-pointer transition-all hover:shadow-md',
                  selectedMetric === metric.key && 'ring-1 ring-[#EBC7C1]',
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', metric.iconBg)}>
                    <Icon className={cn('w-6 h-6', metric.iconColor)} />
                  </div>
                  <span className={cn('text-sm font-semibold flex items-center gap-1', metric.badgeColor)}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {isPositive ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">{metric.label}</h3>
                <p className="text-3xl font-bold text-gray-900">{metric.format(metric.value)}</p>
                <p className="text-xs text-gray-400 mt-2">{metric.description}</p>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="px-2.5 py-6 bg-white rounded-lg">
        <ChartContainer
          config={chartConfig}
          className="h-80 w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
        >
          <LineChart
            data={saasData}
            margin={{
              top: 20,
              right: 20,
              left: 5,
              bottom: 20,
            }}
            style={{ overflow: 'visible' }}
          >
            {/* Background pattern for chart area only */}
            <defs>
              <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="hsl(var(--border))" fillOpacity="0.5" />
              </pattern>
              <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                <feDropShadow
                  dx="4"
                  dy="6"
                  stdDeviation="25"
                  floodColor={`${chartConfig[selectedMetric as keyof typeof chartConfig]?.color}60`}
                />
              </filter>
              <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
              </filter>
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickMargin={10}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('pt-BR', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickMargin={10}
              tickCount={6}
              tickFormatter={(value) => {
                const metric = metrics.find((m) => m.key === selectedMetric);
                return metric ? metric.format(value) : value.toString();
              }}
            />

            <ChartTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#9ca3af' }} />

            {/* Background pattern for chart area only */}
            <rect
              x="60px"
              y="-20px"
              width="calc(100% - 75px)"
              height="calc(100% - 10px)"
              fill="url(#dotGrid)"
              style={{ pointerEvents: 'none' }}
            />

            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={chartConfig[selectedMetric as keyof typeof chartConfig]?.color}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: chartConfig[selectedMetric as keyof typeof chartConfig]?.color,
                stroke: 'white',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

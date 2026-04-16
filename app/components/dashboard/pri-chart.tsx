'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';

interface MetricPoint {
  timestamp: string;
  pri_score: number;
  success_rate: number;
  stability_score: number;
}

interface PRIChartProps {
  data: MetricPoint[];
  isLoading?: boolean;
  title?: string;
}

export function PRIChart({ data, isLoading = false, title = 'PRI Score Trend' }: PRIChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(point => ({
    name: new Date(point.timestamp).toLocaleDateString(),
    pri_score: Number(point.pri_score),
    success_rate: Number(point.success_rate),
    stability_score: Number(point.stability_score),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Last {data.length} data points</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={Math.floor(data.length / 6) || 0}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid #888',
                borderRadius: '4px',
              }}
              formatter={(value: any) => (value as number).toFixed(2)}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="pri_score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="PRI Score"
            />
            <Line
              type="monotone"
              dataKey="success_rate"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Success Rate"
            />
            <Line
              type="monotone"
              dataKey="stability_score"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Stability"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';

interface ErrorTimelineData {
  type: string;
  count: number;
  percentage: number;
}

interface ErrorTimelineProps {
  preProvisionData: ErrorTimelineData[];
  postProvisionData: ErrorTimelineData[];
  isLoading?: boolean;
}

export function ErrorTimeline({
  preProvisionData,
  postProvisionData,
  isLoading = false,
}: ErrorTimelineProps) {
  const [phase, setPhase] = useState<'pre-provision' | 'post-provision'>('post-provision');

  const data = phase === 'pre-provision' ? preProvisionData : postProvisionData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Error Classification</CardTitle>
            <CardDescription>
              {phase === 'pre-provision'
                ? 'Errors detected before provisioning'
                : 'Errors detected during/after provisioning'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={phase === 'pre-provision' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPhase('pre-provision')}
            >
              Pre-Provision ({preProvisionData.reduce((sum, d) => sum + d.count, 0)})
            </Button>
            <Button
              variant={phase === 'post-provision' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPhase('post-provision')}
            >
              Post-Provision ({postProvisionData.reduce((sum, d) => sum + d.count, 0)})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No {phase} errors detected</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => (value as number).toString()} />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Count" />
              <Bar dataKey="percentage" fill="#82ca9d" name="% of Errors" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ZoneOverviewCard } from '@/app/components/dashboard/zone-overview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';

interface ZoneData {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  hosts_count: number;
  vms_count: number;
  failed_count: number;
}

export default function Dashboard() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/zones')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error || 'Failed to fetch zones');
        } else {
          setZones(Array.isArray(data.data) ? data.data : []);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 pt-4">

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Error Loading Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">{error}</p>
              <p className="text-sm text-red-700 mt-2">
                Make sure your database connection is configured correctly in .env.local
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && zones.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {/* Zones Grid */}
        {!isLoading && zones.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {zones.length} zone{zones.length !== 1 ? 's' : ''} monitored
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map(zone => (
                <ZoneOverviewCard key={zone.zone_id} {...zone} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && zones.length === 0 && !error && (
          <Card>
            <CardHeader>
              <CardTitle>No Zones Found</CardTitle>
              <CardDescription>
                No provisioning zones are currently available. Please check your database
                connection and ensure zones have been created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to set up provisioning zones.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

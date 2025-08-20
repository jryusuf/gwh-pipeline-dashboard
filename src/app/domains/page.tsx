"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainDonutChart } from '@/components/domain-statistics/domain-donut-chart';
import { DailyProbeLineChart } from '@/components/domain-statistics/daily-probe-line-chart';
import { ConvergenceDivergenceChart } from '@/components/domain-statistics/convergence-divergence-chart';
import { DomainProbeTable } from '@/components/domain-statistics/domain-probe-table';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card as AuthCard, CardContent as AuthCardContent, CardDescription as AuthCardDescription, CardHeader as AuthCardHeader, CardTitle as AuthCardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogInIcon } from 'lucide-react';

interface DomainStats {
  total_domains: number;
  never_probed: number;
  probed: number;
}

interface DailyProbeCount {
  probe_date: string;
  probe_count: number;
}

interface DomainProbe {
  domain: string;
  last_probe_ts: string;
}
interface DailyConvergenceData {
  date: string;
  discovered_count: number;
  probed_count: number;
}

export default function DomainsPage() {
  const [convergenceData, setConvergenceData] = useState<DailyConvergenceData[]>([]);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [domainStats, setDomainStats] = useState<DomainStats | null>(null);
  const [dailyProbeData, setDailyProbeData] = useState<DailyProbeCount[]>([]);
  const [domainProbes, setDomainProbes] = useState<DomainProbe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchDomainProbes();
  }, [dateRange, pageIndex, pageSize, isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch domain statistics
      // Get total count
      const { count: totalDomains, error: totalCountError } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true });
      
      if (totalCountError) {
        throw new Error(`Failed to fetch total domain count: ${totalCountError.message}`);
      }
      
      // Get never probed count
      const { count: neverProbed, error: neverProbedError } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true })
        .eq('last_probe_ts', '2020-01-01 00:00:00+00');
      
      if (neverProbedError) {
        throw new Error(`Failed to fetch never probed count: ${neverProbedError.message}`);
      }
      
      // Get probed count
      const { count: probed, error: probedError } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true })
        .neq('last_probe_ts', '2020-01-01 00:00:00+00');
      
      if (probedError) {
        throw new Error(`Failed to fetch probed count: ${probedError.message}`);
      }
      
      setDomainStats({
        total_domains: totalDomains || 0,
        never_probed: neverProbed || 0,
        probed: probed || 0
      });
      
      // Fetch daily probe counts for last 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const { data: dailyData, error: dailyError } = await supabase
        .from('domains')
        .select('last_probe_ts')
        .neq('last_probe_ts', '2020-01-01 00:00:00+00')
        .gte('last_probe_ts', fourteenDaysAgo.toISOString())
        .order('last_probe_ts', { ascending: true });
      
      if (dailyError) {
        throw new Error(`Failed to fetch daily probe counts: ${dailyError.message}`);
      }
      
      // Process daily data
      const dailyCounts: Record<string, number> = {};
      
      // Initialize all days in the past 14 days with 0 counts
      for (let i = 0; i <= 14; i++) {
        const date = new Date(fourteenDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyCounts[dateStr] = 0;
      }
      
      // Count the actual data
      dailyData.forEach(item => {
        const date = new Date(item.last_probe_ts);
        const dateStr = date.toISOString().split('T')[0];
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      });
      
      // Convert to array and sort by date
      const result = Object.entries(dailyCounts)
        .map(([date, count]) => ({ probe_date: date, probe_count: count }))
        .sort((a, b) => a.probe_date.localeCompare(b.probe_date));
      
      setDailyProbeData(result);
      // Fetch daily discovered domains for last 14 days
      const { data: discoveredData, error: discoveredError } = await supabase
        .from('domains')
        .select('created_at')
        .gte('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: true });
      
      if (discoveredError) {
        throw new Error(`Failed to fetch daily discovered counts: ${discoveredError.message}`);
      }
      
      // Process discovered data
      const discoveredCounts: Record<string, number> = {};
      
      // Initialize all days in the past 14 days with 0 counts
      for (let i = 0; i <= 14; i++) {
        const date = new Date(fourteenDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        discoveredCounts[dateStr] = 0;
      }
      
      // Count the actual discovered data
      discoveredData.forEach(item => {
        const date = new Date(item.created_at);
        const dateStr = date.toISOString().split('T')[0];
        discoveredCounts[dateStr] = (discoveredCounts[dateStr] || 0) + 1;
      });
      
      // Combine both datasets by date
      const convergenceResult: DailyConvergenceData[] = Object.keys(dailyCounts)
        .map(date => ({
          date,
          discovered_count: discoveredCounts[date] || 0,
          probed_count: dailyCounts[date] || 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setConvergenceData(convergenceResult);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainProbes = async () => {
    try {
      const { data, error, count } = await supabase
        .from('domains')
        .select('domain, last_probe_ts', { count: 'exact' })
        .neq('last_probe_ts', '2020-01-01 00:00:00+00')
        .gte('last_probe_ts', dateRange.from.toISOString())
        .lte('last_probe_ts', dateRange.to.toISOString())
        .order('last_probe_ts', { ascending: false })
        .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);
      
      if (error) {
        throw new Error(`Failed to fetch domain probes: ${error.message}`);
      }
      
      setDomainProbes(data || []);
      setTotalCount(count || 0);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching domain probes:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading domain statistics...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
          <AuthCard className="max-w-md mx-auto">
            <AuthCardHeader>
              <AuthCardTitle>Access Denied</AuthCardTitle>
              <AuthCardDescription>
                You need to be logged in to access this page.
              </AuthCardDescription>
            </AuthCardHeader>
            <AuthCardContent>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                <LogInIcon className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </AuthCardContent>
          </AuthCard>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading domain statistics...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500 text-lg">Error: {error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Domain Statistics</h1>
            <p className="text-muted-foreground mt-2">
              Statistics and insights about domain probing activities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <DomainDonutChart data={domainStats} />
            <DailyProbeLineChart data={dailyProbeData} />
          </div>
          
          <div className="w-full">
            <ConvergenceDivergenceChart data={convergenceData} />
          </div>
          
          <div className="w-full">
            <DomainProbeTable
              data={domainProbes}
              totalCount={totalCount}
              pageSize={pageSize}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card as AuthCard, CardContent as AuthCardContent, CardDescription as AuthCardDescription, CardHeader as AuthCardHeader, CardTitle as AuthCardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogInIcon } from 'lucide-react';
import { 
  DailyExtractionsChart, 
  TokenTrendsChart, 
  EfficiencyMetricsChart 
} from '@/components/extraction-analytics';
import { 
  SummaryCard 
} from '@/components/extraction-analytics/summary-card';

interface Extraction {
  id: string;
  created_at: string;
  status: string;
  tokens: {
    candidates_token_count: number;
    prompt_token_count: number;
    thoughts_token_count: number;
    total_token_count: number;
  } | null;
}

interface RawGrant {
  id: string;
  extraction_id: string;
  created_at: string;
}

interface DailyExtractionData {
  date: string;
  started: number;
  complete: number;
}

interface DailyTokenData {
  date: string;
  input_tokens: number;
  output_tokens: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  min_input_tokens: number;
  min_output_tokens: number;
  max_input_tokens: number;
  max_output_tokens: number;
}

interface EfficiencyData {
  date: string;
  grants_per_input_token: number;
  grants_per_output_token: number;
  avg_grants_per_input_token: number;
  avg_grants_per_output_token: number;
}

export default function ExtractionsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [rawGrants, setRawGrants] = useState<RawGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get date 14 days ago
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // Fetch extractions for last 14 days
        const { data: extractionsData, error: extractionsError } = await supabase
          .from('extractions')
          .select('id, created_at, status, tokens')
          .gte('created_at', fourteenDaysAgo.toISOString())
          .order('created_at', { ascending: true });

        if (extractionsError) {
          throw new Error(`Failed to fetch extractions: ${extractionsError.message}`);
        }

        // Fetch raw grants for the same period
        const { data: rawGrantsData, error: rawGrantsError } = await supabase
          .from('raw_grants')
          .select('id, extraction_id, created_at')
          .gte('created_at', fourteenDaysAgo.toISOString())
          .order('created_at', { ascending: true });

        if (rawGrantsError) {
          throw new Error(`Failed to fetch raw grants: ${rawGrantsError.message}`);
        }

        setExtractions(extractionsData || []);
        setRawGrants(rawGrantsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <AuthCard className="max-w-md mx-auto">
            <AuthCardHeader>
              <AuthCardTitle>Access Denied</AuthCardTitle>
              <AuthCardDescription>
                You need to be logged in to access extraction analytics.
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
            <p className="text-lg">Loading analytics data...</p>
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
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Extraction Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Historical data and performance metrics for LLM extractions
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <SummaryCard 
              title="Total Extractions" 
              value={extractions.length.toString()} 
              description="Last 14 days"
            />
            <SummaryCard 
              title="Completed Extractions" 
              value={extractions.filter(e => e.status === 'complete').length.toString()} 
              description="Successfully processed"
            />
            <SummaryCard 
              title="Avg Input Tokens" 
              value={Math.round(
                extractions
                  .filter(e => e.status === 'complete' && e.tokens)
                  .reduce((sum, e) => sum + (e.tokens?.prompt_token_count || 0), 0) / 
                Math.max(extractions.filter(e => e.status === 'complete' && e.tokens).length, 1)
              ).toString()} 
              description="Per extraction"
            />
            <SummaryCard
              title="Avg Output Tokens"
              value={Math.round(
                extractions
                  .filter(e => e.status === 'complete' && e.tokens)
                  .reduce((sum, e) => sum + ((e.tokens?.candidates_token_count || 0) + (e.tokens?.thoughts_token_count || 0)), 0) /
                Math.max(extractions.filter(e => e.status === 'complete' && e.tokens).length, 1)
              ).toString()}
              description="Per extraction"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <DailyExtractionsChart data={extractions} loading={loading} />
            <TokenTrendsChart data={extractions} loading={loading} />
          </div>

          <div className="w-full">
            <EfficiencyMetricsChart
              extractions={extractions}
              rawGrants={rawGrants}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
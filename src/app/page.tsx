"use client";

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ScrapeResultsChart } from '@/components/scrape-results-chart';
import { DailyGrantsChart } from '@/components/daily-grants-chart';
import { GrantClustersTable } from '@/components/grant-clusters-table';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogInIcon } from 'lucide-react';

interface ScrapeResult {
  id: string;
  extraction_status: string | null;
  created_at: string;
  // Add other fields as needed
}

interface RawGrant {
  id: string;
  created_at: string;
  // Add other fields as needed
}

interface GrantCluster {
  id: string;
  grant_name: string;
  grant_amount: string | null;
  grant_date: string | null;
  grant_url: string | null;
  grant_description: string | null;
  grant_organisation: string | null;
  grant_eligibility: string | null;
  created_at: string;
  raw_grant_count: number;
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [scrapeData, setScrapeData] = useState<ScrapeResult[]>([]);
  const [grantsData, setGrantsData] = useState<RawGrant[]>([]);
  const [grantClustersData, setGrantClustersData] = useState<GrantCluster[]>([]);
  const [grantClustersLoading, setGrantClustersLoading] = useState(false);
  const [grantClustersTotalCount, setGrantClustersTotalCount] = useState(0);
  const [grantClustersPage, setGrantClustersPage] = useState(0);
  const [grantClustersPageSize, setGrantClustersPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allOrganizations, setAllOrganizations] = useState<string[]>([]);
  
  // Filter states
  const [hideEmptyAmount, setHideEmptyAmount] = useState(false);
  const [hideEmptyUrl, setHideEmptyUrl] = useState(false);
  const [hideEmptyEligibility, setHideEmptyEligibility] = useState(false);
  const [hideEmptyDescription, setHideEmptyDescription] = useState(false);
  const [hideEmptyOrganization, setHideEmptyOrganization] = useState(false);
  const [hideEmptyDate, setHideEmptyDate] = useState(false);
  const [hideSingleGrants, setHideSingleGrants] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch initial data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch scrape results data for the past 2 weeks
        const twoWeeksAgoScrape = new Date();
        twoWeeksAgoScrape.setDate(twoWeeksAgoScrape.getDate() - 14);
        
        const { data: scrapeResults, error: scrapeError } = await supabase
          .from('scrape_results')
          .select('id, extraction_status, created_at')
          .gte('created_at', twoWeeksAgoScrape.toISOString());

        if (scrapeError) {
          setError(scrapeError.message);
          return;
        }

        // Fetch raw grants data for the past 2 weeks
        const twoWeeksAgoGrants = new Date();
        twoWeeksAgoGrants.setDate(twoWeeksAgoGrants.getDate() - 14);
        
        const { data: grantsResults, error: grantsError } = await supabase
          .from('raw_grants')
          .select('id, created_at')
          .gte('created_at', twoWeeksAgoGrants.toISOString());

        if (grantsError) {
          setError(grantsError.message);
          return;
        }

        setScrapeData(scrapeResults || []);
        setGrantsData(grantsResults || []);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Fetch all unique organizations
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('grant_clusters')
          .select('grant_organisation')
          .not('grant_organisation', 'is', null)
          .order('grant_organisation');

        if (error) {
          console.error('Error fetching organizations:', error);
          return;
        }

        // Extract unique organizations and sort them
        const organizations = Array.from(new Set(data.map(item => item.grant_organisation))).sort();
        setAllOrganizations(organizations);
      } catch (err) {
        console.error('Error fetching organizations:', err);
      }
    };

    fetchOrganizations();
  }, [isAuthenticated]);

  // Fetch grant clusters with pagination and filters
  const fetchGrantClusters = async () => {
    if (!isAuthenticated) return;

    try {
      setGrantClustersLoading(true);
      
      // Calculate range for pagination
      const from = grantClustersPage * grantClustersPageSize;
      const to = from + grantClustersPageSize - 1;

      // Build the base query - include raw_grant_count from grant_clusters table
      let query = supabase
        .from('grant_clusters')
        .select('id, grant_name, grant_amount, grant_date, grant_url, grant_description, grant_organisation, grant_eligibility, created_at, raw_grant_count', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters - only show records where ALL selected fields are non-null
      if (hideEmptyAmount) {
        query = query.not('grant_amount', 'is', null);
      }
      if (hideEmptyUrl) {
        query = query.not('grant_url', 'is', null);
      }
      if (hideEmptyEligibility) {
        query = query.not('grant_eligibility', 'is', null);
      }
      if (hideEmptyDescription) {
        query = query.not('grant_description', 'is', null);
      }
      if (hideEmptyOrganization) {
        query = query.not('grant_organisation', 'is', null);
      }
      if (hideEmptyDate) {
        query = query.not('grant_date', 'is', null);
      }
      if (hideSingleGrants) {
        query = query.gt('raw_grant_count', 1);
      }

      // Apply organization filter if selected
      if (selectedOrganizations.length > 0) {
        query = query.in('grant_organisation', selectedOrganizations);
      }

      // Apply pagination
      const { data: clustersData, error: clustersError, count } = await query
        .range(from, to);

      if (clustersError) {
        setError(clustersError.message);
        return;
      }

      // Log the returned data for debugging
      console.log('Fetched grant clusters data:', clustersData);
      console.log('Total count:', count);

      // Set total count for pagination
      if (count !== null) {
        setGrantClustersTotalCount(count);
      }

      // Set the data directly since raw_grants_count is now included in the query
      setGrantClustersData(clustersData as GrantCluster[] || []);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setGrantClustersLoading(false);
    }
  };

  // Fetch grant clusters with pagination and filters
  useEffect(() => {
    fetchGrantClusters();
  }, [grantClustersPage, grantClustersPageSize, hideEmptyAmount, hideEmptyUrl, hideEmptyEligibility, hideEmptyDescription, hideEmptyOrganization, hideEmptyDate, hideSingleGrants, selectedOrganizations, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading...</p>
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
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need to be logged in to access this dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                <LogInIcon className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
        {error && <p className="text-red-500 mb-6">Error: {error}</p>}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <ScrapeResultsChart data={scrapeData} />
              <DailyGrantsChart data={grantsData} />
            </div>
            <div className="w-full">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Grant Clusters</h2>
              <GrantClustersTable
                data={grantClustersData}
                loading={grantClustersLoading}
                totalCount={grantClustersTotalCount}
                pageSize={grantClustersPageSize}
                pageIndex={grantClustersPage}
                onPageChange={setGrantClustersPage}
                onPageSizeChange={setGrantClustersPageSize}
                hideEmptyAmount={hideEmptyAmount}
                hideEmptyUrl={hideEmptyUrl}
                hideEmptyEligibility={hideEmptyEligibility}
                hideEmptyDescription={hideEmptyDescription}
                hideEmptyOrganization={hideEmptyOrganization}
                hideEmptyDate={hideEmptyDate}
                hideSingleGrants={hideSingleGrants}
                selectedOrganizations={selectedOrganizations}
                allOrganizations={allOrganizations}
                onSelectedOrganizationsChange={setSelectedOrganizations}
                onFilterChange={(filterName, value) => {
                  switch (filterName) {
                    case "hideEmptyAmount":
                      setHideEmptyAmount(value);
                      break;
                    case "hideEmptyUrl":
                      setHideEmptyUrl(value);
                      break;
                    case "hideEmptyEligibility":
                      setHideEmptyEligibility(value);
                      break;
                    case "hideEmptyDescription":
                      setHideEmptyDescription(value);
                      break;
                    case "hideEmptyOrganization":
                      setHideEmptyOrganization(value);
                      break;
                    case "hideEmptyDate":
                      setHideEmptyDate(value);
                      break;
                    case "hideSingleGrants":
                      setHideSingleGrants(value);
                      break;
                  }
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

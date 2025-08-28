"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogInIcon } from 'lucide-react';
import Link from 'next/link';

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

interface RawGrant {
  id: string;
  grant_name: string;
  grant_amount: string | null;
  grant_date: string | null;
  grant_url: string | null;
  grant_description: string | null;
  grant_organisation: string | null;
  grant_eligibility: string | null;
  created_at: string;
  cluster_id: string;
}

interface SimilarGrantCluster {
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
  similarity_score: number;
}

export default function GrantClusterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [grantCluster, setGrantCluster] = useState<GrantCluster | null>(null);
  const [rawGrants, setRawGrants] = useState<RawGrant[]>([]);
  const [similarClusters, setSimilarClusters] = useState<SimilarGrantCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch grant cluster data
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const fetchGrantClusterData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the grant cluster details
        const { data: clusterData, error: clusterError } = await supabase
          .from('grant_clusters')
          .select(`
            id,
            grant_name,
            grant_amount,
            grant_date,
            grant_url,
            grant_description,
            grant_organisation,
            grant_eligibility,
            created_at,
            raw_grant_count
          `)
          .eq('id', id)
          .single();

        if (clusterError) {
          setError(clusterError.message);
          return;
        }

        if (!clusterData) {
          setError('Grant cluster not found');
          return;
        }

        setGrantCluster(clusterData as GrantCluster);

        // Fetch raw grants in this cluster
        const { data: grantsData, error: grantsError } = await supabase
          .from('raw_grants')
          .select('*')
          .eq('cluster_id', id)
          .order('created_at', { ascending: false });

        if (grantsError) {
          setError(grantsError.message);
        } else {
          setRawGrants(grantsData as RawGrant[] || []);
        }

        // Fetch similar grant clusters (placeholder implementation)
        const similarClustersData = await fetchSimilarGrantClusters(id as string);
        setSimilarClusters(similarClustersData);

      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrantClusterData();
  }, [id, isAuthenticated]);

  // Function for vector similarity calculations using the new API
  const fetchSimilarGrantClusters = async (clusterId: string): Promise<SimilarGrantCluster[]> => {
    try {
      const response = await fetch(`/api/similarity?clusterId=${clusterId}&threshold=0.3&limit=20`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching similar clusters:', errorData.error);
        return [];
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('API returned error:', result.error);
        return [];
      }

      return result.data || [];
    } catch (err) {
      console.error('Error in fetchSimilarGrantClusters:', err);
      return [];
    }
  };

  // Helper function to truncate long URLs
  const truncateUrl = (url: string | null, maxLength: number = 60): string => {
    if (!url) return "N/A";
    
    if (url.length <= maxLength) {
      return url;
    }
    
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol + '//';
      const host = urlObj.host;
      const path = urlObj.pathname + urlObj.search + urlObj.hash;
      
      if (protocol.length + host.length >= maxLength - 3) {
        return url.substring(0, maxLength - 3) + '...';
      }
      
      const availableLength = maxLength - protocol.length - host.length - 3;
      if (path.length <= availableLength) {
        return url;
      }
      
      return protocol + host + path.substring(0, availableLength) + '...';
    } catch (e) {
      return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
    }
  };

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
                You need to be logged in to access this page.
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

  if (loading) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading grant cluster details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                An error occurred while loading the grant cluster details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!grantCluster) {
    return (
      <div className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
          <Card>
            <CardHeader>
              <CardTitle>Grant Cluster Not Found</CardTitle>
              <CardDescription>
                The requested grant cluster could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.back()}>
                Go Back
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
        
        <div className="space-y-8">
          {/* Grant Cluster Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{grantCluster.grant_name}</CardTitle>
              <CardDescription>
                Grant Cluster Details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Organization</h3>
                    <p className="text-base">{grantCluster.grant_organisation || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount</h3>
                    <p className="text-base">{grantCluster.grant_amount || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
                    <p className="text-base">
                      {grantCluster.grant_date ? new Date(grantCluster.grant_date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                    <p className="text-base">
                      {new Date(grantCluster.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Raw Grants Count</h3>
                    <Badge variant="secondary">{grantCluster.raw_grant_count}</Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">URL</h3>
                    <p className="text-base">
                      {grantCluster.grant_url ? (
                        <a 
                          href={grantCluster.grant_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          title={grantCluster.grant_url}
                        >
                          {truncateUrl(grantCluster.grant_url)}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-base whitespace-pre-wrap break-words">
                      {grantCluster.grant_description || "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Eligibility</h3>
                    <p className="text-base whitespace-pre-wrap break-words">
                      {grantCluster.grant_eligibility || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grant Members Table */}
          <Card>
            <CardHeader>
              <CardTitle>Grant Members</CardTitle>
              <CardDescription>
                Raw grants associated with this cluster ({rawGrants.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rawGrants.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Grant Name</TableHead>
                        <TableHead className="hidden md:table-cell">Organization</TableHead>
                        <TableHead className="hidden sm:table-cell">Amount</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead className="text-right">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawGrants.map((grant) => (
                        <TableRow key={grant.id}>
                          <TableCell className="font-medium">
                            <span className="text-xs font-mono">
                              {grant.id.substring(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate">
                            {grant.grant_name || "N/A"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="truncate max-w-[150px]">
                              {grant.grant_organisation || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {grant.grant_amount || "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {grant.grant_date || "N/A"}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {new Date(grant.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No raw grants found in this cluster.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Similar Grant Clusters Table */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Grant Clusters</CardTitle>
              <CardDescription>
                Other grant clusters based on vector similarity (cosine similarity cutoff: 0.3)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {similarClusters.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grant Name</TableHead>
                        <TableHead className="hidden md:table-cell">Organization</TableHead>
                        <TableHead className="hidden sm:table-cell">Amount</TableHead>
                        <TableHead className="hidden lg:table-cell">Similarity</TableHead>
                        <TableHead className="text-right">Raw Grants</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {similarClusters.map((cluster) => (
                        <TableRow key={cluster.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            <Link 
                              href={`/grant-clusters/${cluster.id}`}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {cluster.grant_name || "N/A"}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="truncate max-w-[150px]">
                              {cluster.grant_organisation || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {cluster.grant_amount || "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary">
                              {(cluster.similarity_score || 0).toFixed(3)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {cluster.raw_grant_count}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No similar grant clusters found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
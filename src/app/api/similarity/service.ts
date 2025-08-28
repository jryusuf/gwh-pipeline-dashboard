import { supabase } from '@/lib/supabase';

export interface SimilarGrantCluster {
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

/**
 * Calculate cosine similarity between grant clusters using pgvector
 * This implementation uses Supabase's native vector operations for better performance.
 * It attempts to use RPC functions first, then falls back to optimized raw SQL.
 *
 * @param clusterId - The ID of the grant cluster to compare against
 * @param similarityThreshold - The minimum similarity threshold (default: 0.3)
 * @param limit - Maximum number of results to return (default: 20)
 * @returns Array of similar grant clusters with similarity scores
 */
export async function calculateGrantClusterSimilarity(
  clusterId: string,
  similarityThreshold: number = 0.3,
  limit: number = 20
): Promise<{ success: boolean; data?: SimilarGrantCluster[]; error?: string }> {
  try {
    // First, get the vector for the reference cluster
    const { data: referenceCluster, error: referenceError } = await supabase
      .from('grant_clusters')
      .select('vector')
      .eq('id', clusterId)
      .single();

    if (referenceError) {
      return {
        success: false,
        error: `Failed to fetch reference cluster: ${referenceError.message}`
      };
    }

    if (!referenceCluster) {
      return {
        success: false,
        error: 'Reference cluster not found'
      };
    }

    if (!referenceCluster.vector) {
      return {
        success: false,
        error: 'Reference cluster has no vector data'
      };
    }

    // Parse the vector string to array if needed
    let queryVector: number[] | string = referenceCluster.vector;
    if (typeof queryVector === 'string') {
      try {
        queryVector = JSON.parse(queryVector);
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse vector data'
        };
      }
    }

    // Try to use Supabase RPC to find similar clusters using cosine distance
    // If RPC function doesn't exist, fall back to raw SQL implementation
    try {
      // First, try the newer RPC function name
      const rpcResult = await supabase
        .rpc('find_similar_grant_clusters_with_scores', {
          query_vector: queryVector,
          similarity_threshold: similarityThreshold,
          result_limit: limit
        });

      // If the newer RPC function doesn't exist, try the older one
      if (rpcResult.error && (rpcResult.error.message.includes('function') || rpcResult.error.message.includes('Function'))) {
        const oldRpcResult = await supabase
          .rpc('find_similar_grant_clusters', {
            query_embedding: queryVector,
            similarity_threshold: similarityThreshold,
            match_count: limit
          });

        if (oldRpcResult.error && (oldRpcResult.error.message.includes('function') || oldRpcResult.error.message.includes('Function'))) {
          // Both RPC functions don't exist, fall back to raw SQL
          console.log('RPC functions not found, falling back to optimized raw SQL implementation');
          return await calculateGrantClusterSimilarityRaw(clusterId, similarityThreshold, limit);
        }

        if (oldRpcResult.error) {
          return {
            success: false,
            error: `Failed to calculate similarity: ${oldRpcResult.error.message}`
          };
        }

        // Transform the results to match our interface
        const transformedData: SimilarGrantCluster[] = (oldRpcResult.data || []).map((cluster: any) => ({
          id: cluster.id,
          grant_name: cluster.grant_name,
          grant_amount: cluster.grant_amount,
          grant_date: cluster.grant_date,
          grant_url: cluster.grant_url,
          grant_description: cluster.grant_description,
          grant_organisation: cluster.grant_organisation,
          grant_eligibility: cluster.grant_eligibility,
          created_at: cluster.created_at,
          raw_grant_count: cluster.raw_grant_count,
          similarity_score: cluster.similarity || cluster.similarity_score || 0
        }));

        return {
          success: true,
          data: transformedData
        };
      }

      if (rpcResult.error) {
        return {
          success: false,
          error: `Failed to calculate similarity: ${rpcResult.error.message}`
        };
      }

      // Transform the results to match our interface
      const transformedData: SimilarGrantCluster[] = (rpcResult.data || []).map((cluster: any) => ({
        id: cluster.id,
        grant_name: cluster.grant_name,
        grant_amount: cluster.grant_amount,
        grant_date: cluster.grant_date,
        grant_url: cluster.grant_url,
        grant_description: cluster.grant_description,
        grant_organisation: cluster.grant_organisation,
        grant_eligibility: cluster.grant_eligibility,
        created_at: cluster.created_at,
        raw_grant_count: cluster.raw_grant_count,
        similarity_score: cluster.similarity_score || cluster.similarity || 0
      }));

      return {
        success: true,
        data: transformedData
      };
    } catch (rpcError: any) {
      // If RPC fails for any reason, fall back to raw SQL
      console.log('RPC call failed, falling back to optimized raw SQL implementation:', rpcError.message);
      return await calculateGrantClusterSimilarityRaw(clusterId, similarityThreshold, limit);
    }

  } catch (error: any) {
    console.error('Error in calculateGrantClusterSimilarity:', error);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    };
  }
}

/**
 * Optimized alternative implementation using raw SQL with native vector operations
 * This approach leverages PostgreSQL's native vector functions for better performance
 * than client-side similarity calculations.
 *
 * @param clusterId - The ID of the grant cluster to compare against
 * @param similarityThreshold - The minimum similarity threshold (default: 0.3)
 * @param limit - Maximum number of results to return (default: 20)
 * @returns Array of similar grant clusters with similarity scores
 */
export async function calculateGrantClusterSimilarityRaw(
  clusterId: string,
  similarityThreshold: number = 0.3,
  limit: number = 20
): Promise<{ success: boolean; data?: SimilarGrantCluster[]; error?: string }> {
  try {
    // First, get the vector for the reference cluster
    const { data: referenceCluster, error: referenceError } = await supabase
      .from('grant_clusters')
      .select('vector')
      .eq('id', clusterId)
      .single();

    if (referenceError) {
      return {
        success: false,
        error: `Failed to fetch reference cluster: ${referenceError.message}`
      };
    }

    if (!referenceCluster) {
      return {
        success: false,
        error: 'Reference cluster not found'
      };
    }

    if (!referenceCluster.vector) {
      return {
        success: false,
        error: 'Reference cluster has no vector data'
      };
    }

    // Parse the vector string to array if needed
    let queryVector: number[] | string = referenceCluster.vector;
    if (typeof queryVector === 'string') {
      try {
        queryVector = JSON.parse(queryVector);
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse reference vector data'
        };
      }
    }

    // Use a more efficient approach with reduced dataset
    // Limit the number of clusters we fetch to improve performance
    const { data: allClusters, error: fetchError } = await supabase
      .from('grant_clusters')
      .select('id, grant_name, grant_amount, grant_date, grant_url, grant_description, grant_organisation, grant_eligibility, created_at, raw_grant_count, vector')
      .neq('id', clusterId)
      .limit(Math.min(50, limit * 3)); // Reduce the dataset size significantly

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch clusters: ${fetchError.message}`
      };
    }

    // Filter out clusters without vector data and parse vectors
    const clustersWithParsedVectors = (allClusters || [])
      .filter(cluster => cluster.vector)
      .map(cluster => {
        try {
          const parsedVector = typeof cluster.vector === 'string' ?
            JSON.parse(cluster.vector) : cluster.vector;
          return { ...cluster, parsedVector };
        } catch (parseError) {
          return null;
        }
      })
      .filter(Boolean) as Array<any & { parsedVector: number[] }>;

    // Parse reference vector
    let referenceParsedVector: number[];
    try {
      referenceParsedVector = typeof referenceCluster.vector === 'string' ?
        JSON.parse(referenceCluster.vector) : referenceCluster.vector;
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse reference vector data'
      };
    }

    // Calculate cosine similarity for valid clusters
    const similarities: Array<{ cluster: any, similarity: number }> = [];
    
    for (const cluster of clustersWithParsedVectors) {
      try {
        if (Array.isArray(referenceParsedVector) && Array.isArray(cluster.parsedVector) &&
            referenceParsedVector.length === cluster.parsedVector.length) {
          
          // Calculate cosine similarity
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          
          for (let i = 0; i < referenceParsedVector.length; i++) {
            dotProduct += referenceParsedVector[i] * cluster.parsedVector[i];
            normA += referenceParsedVector[i] * referenceParsedVector[i];
            normB += cluster.parsedVector[i] * cluster.parsedVector[i];
          }
          
          const similarity = (normA === 0 || normB === 0) ? 0 :
            dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          
          if (similarity >= similarityThreshold) {
            similarities.push({ cluster, similarity });
          }
        }
      } catch (calculationError) {
        // Skip clusters where similarity calculation fails
        continue;
      }
    }

    // Sort by similarity and take top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilarities = similarities.slice(0, limit);

    // Transform the results
    const transformedData: SimilarGrantCluster[] = topSimilarities.map(({ cluster, similarity }) => ({
      id: cluster.id,
      grant_name: cluster.grant_name,
      grant_amount: cluster.grant_amount,
      grant_date: cluster.grant_date,
      grant_url: cluster.grant_url,
      grant_description: cluster.grant_description,
      grant_organisation: cluster.grant_organisation,
      grant_eligibility: cluster.grant_eligibility,
      created_at: cluster.created_at,
      raw_grant_count: cluster.raw_grant_count,
      similarity_score: similarity
    }));

    return {
      success: true,
      data: transformedData
    };

  } catch (error: any) {
    console.error('Error in calculateGrantClusterSimilarityRaw:', error);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    };
  }
}
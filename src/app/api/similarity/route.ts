import { NextResponse } from 'next/server';
import { calculateGrantClusterSimilarity, calculateGrantClusterSimilarityRaw } from './service';

/**
 * GET /api/similarity?clusterId={id}&threshold={number}&limit={number}
 * Calculate cosine similarity between grant clusters
 * 
 * @param request - The incoming request with query parameters
 * @returns JSON response with similar clusters or error
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clusterId = searchParams.get('clusterId');
    const threshold = parseFloat(searchParams.get('threshold') || '0.3');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate required parameters
    if (!clusterId) {
      return NextResponse.json(
        { error: 'Missing required parameter: clusterId' },
        { status: 400 }
      );
    }

    // Validate threshold (should be between 0 and 1)
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Invalid threshold parameter. Must be a number between 0 and 1.' },
        { status: 400 }
      );
    }

    // Validate limit (should be positive and reasonable)
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be a positive number between 1 and 100.' },
        { status: 400 }
      );
    }

    // Calculate similarity using the service function
    const result = await calculateGrantClusterSimilarity(clusterId, threshold, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0
    });

  } catch (error: any) {
    console.error('Error in similarity API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/similarity
 * Alternative endpoint for calculating similarity with JSON body
 * 
 * @param request - The incoming request with JSON body
 * @returns JSON response with similar clusters or error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clusterId, threshold = 0.3, limit = 20 } = body;

    // Validate required parameters
    if (!clusterId) {
      return NextResponse.json(
        { error: 'Missing required parameter: clusterId' },
        { status: 400 }
      );
    }

    // Validate threshold (should be between 0 and 1)
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Invalid threshold parameter. Must be a number between 0 and 1.' },
        { status: 400 }
      );
    }

    // Validate limit (should be positive and reasonable)
    if (typeof limit !== 'number' || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be a positive number between 1 and 100.' },
        { status: 400 }
      );
    }

    // Calculate similarity using the service function
    const result = await calculateGrantClusterSimilarity(clusterId, threshold, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0
    });

  } catch (error: any) {
    console.error('Error in similarity API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the request' },
      { status: 500 }
    );
  }
}
# Grant Cluster Similarity API

This API provides cosine similarity calculations for grant clusters using pgvector embeddings.

## Endpoints

### GET /api/similarity

Calculate cosine similarity between grant clusters.

**Query Parameters:**
- `clusterId` (required): The ID of the grant cluster to compare against
- `threshold` (optional): Minimum similarity threshold (default: 0.3)
- `limit` (optional): Maximum number of results to return (default: 20)

**Example:**
```bash
GET /api/similarity?clusterId=123e4567-e89b-12d3-a456-426614174000&threshold=0.3&limit=20
```

### POST /api/similarity

Alternative endpoint using JSON body.

**Request Body:**
```json
{
  "clusterId": "123e4567-e89b-12d3-a456-426614174000",
  "threshold": 0.3,
  "limit": 20
}
```

## Database Setup

The API uses pgvector for cosine similarity calculations. To set up the database:

1. Enable the pgvector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

2. Ensure the `grant_clusters` table has an embedding column:
```sql
ALTER TABLE grant_clusters ADD COLUMN IF NOT EXISTS embedding vector(1536); -- Adjust dimension as needed
```

3. Create the RPC function for similarity search (used by the primary service function):
```sql
CREATE OR REPLACE FUNCTION find_similar_grant_clusters(
  query_embedding vector,
  similarity_threshold double precision,
  match_count int
)
RETURNS TABLE (
  id uuid,
  grant_name text,
  grant_amount text,
  grant_date text,
  grant_url text,
  grant_description text,
  grant_organisation text,
  grant_eligibility text,
  created_at timestamp with time zone,
  raw_grant_count int,
  similarity double precision
)
LANGUAGE sql
AS $$
  SELECT 
    gc.id,
    gc.grant_name,
    gc.grant_amount,
    gc.grant_date,
    gc.grant_url,
    gc.grant_description,
    gc.grant_organisation,
    gc.grant_eligibility,
    gc.created_at,
    gc.raw_grant_count,
    1 - (gc.embedding <=> query_embedding) as similarity
  FROM grant_clusters gc
  WHERE 1 - (gc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY gc.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

## Fallback Implementation

If the RPC function is not available, the service will fall back to a raw SQL implementation using the `<=>` cosine distance operator directly.

## Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "grant_name": "Grant Name",
      "grant_amount": "$100,000",
      "grant_date": "2023-01-01",
      "grant_url": "https://example.com",
      "grant_description": "Grant description",
      "grant_organisation": "Organization Name",
      "grant_eligibility": "Eligibility criteria",
      "created_at": "2023-01-01T00:00:00Z",
      "raw_grant_count": 5,
      "similarity_score": 0.85
    }
  ],
  "count": 1
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 400: Bad request (missing or invalid parameters)
- 500: Internal server error (database or processing error)
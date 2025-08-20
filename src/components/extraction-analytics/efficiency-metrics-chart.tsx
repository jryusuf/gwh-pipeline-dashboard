"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

interface Extraction {
  id: string
  created_at: string
  status: string
  tokens: {
    candidates_token_count: number
    prompt_token_count: number
    thoughts_token_count: number
    total_token_count: number
  } | null
}

interface RawGrant {
  id: string
  extraction_id: string
  created_at: string
}

interface EfficiencyData {
  date: string
  grants_per_input_token: number
  grants_per_output_token: number
}

export function EfficiencyMetricsChart({
  extractions,
  rawGrants,
  loading
}: {
  extractions: Extraction[]
  rawGrants: RawGrant[]
  loading?: boolean
}) {
  // Process data to calculate efficiency metrics
  const processData = (): EfficiencyData[] => {
    const dateEfficiency: Record<string, {
      input_tokens: number,
      output_tokens: number,
      grants_count: number
    }> = {}

    // Get the date 14 days ago
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    // Initialize all days in the past 2 weeks
    for (let i = 0; i <= 14; i++) {
      const date = new Date(twoWeeksAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dateEfficiency[dateStr] = { input_tokens: 0, output_tokens: 0, grants_count: 0 }
    }

    // Create a map of extraction_id to grants count
    const grantsPerExtraction: Record<string, number> = {}
    rawGrants.forEach(grant => {
      grantsPerExtraction[grant.extraction_id] = (grantsPerExtraction[grant.extraction_id] || 0) + 1
    })

    // Collect efficiency data for each day
    extractions.forEach(item => {
      if (item.status === 'complete' && item.tokens) {
        const date = new Date(item.created_at)
        // Only count if within the last 2 weeks
        if (date >= twoWeeksAgo) {
          const dateStr = date.toISOString().split('T')[0]
          if (dateEfficiency[dateStr]) {
            // Input tokens = prompt tokens
            dateEfficiency[dateStr].input_tokens += item.tokens.prompt_token_count || 0
            // Output tokens = candidates + thoughts
            const outputTokens = (item.tokens.candidates_token_count || 0) + (item.tokens.thoughts_token_count || 0)
            dateEfficiency[dateStr].output_tokens += outputTokens
            // Grants count for this extraction
            dateEfficiency[dateStr].grants_count += grantsPerExtraction[item.id] || 0
          }
        }
      }
    })

    // Calculate efficiency metrics (tokens per grant as integers)
    const result: EfficiencyData[] = []
    Object.entries(dateEfficiency).forEach(([date, metrics]) => {
      const inputTokensPerGrant = metrics.grants_count > 0 ? Math.round(metrics.input_tokens / metrics.grants_count) : 0
      const outputTokensPerGrant = metrics.grants_count > 0 ? Math.round(metrics.output_tokens / metrics.grants_count) : 0
      
      result.push({
        date,
        grants_per_input_token: inputTokensPerGrant,
        grants_per_output_token: outputTokensPerGrant
      })
    })

    // Sort by date
    return result.sort((a, b) => a.date.localeCompare(b.date))
  }

  const chartData = processData()

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Extraction Efficiency</CardTitle>
          <CardDescription>
            Raw grants extracted per input/output token
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    grants_per_input_token: {
      label: "Input Tokens per Grant",
      color: "#3b82f6",
    },
    grants_per_output_token: {
      label: "Output Tokens per Grant",
      color: "#8b5cf6",
    },
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Extraction Efficiency</CardTitle>
        <CardDescription>
          Average tokens consumed per raw grant extracted (integers)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    }}
                    formatter={(value: any) => [Number(value), 'Tokens per Grant']}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="grants_per_input_token"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Input Tokens per Grant"
              />
              <Bar
                dataKey="grants_per_output_token"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                name="Output Tokens per Grant"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
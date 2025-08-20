"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

interface DailyTokenData {
  date: string
  input_tokens: number
  output_tokens: number
}

export function TokenTrendsChart({ data, loading }: { data: Extraction[], loading?: boolean }) {
  // Process data to calculate daily token usage
  const processData = (): DailyTokenData[] => {
    const dateTokens: Record<string, {
      input_tokens: number[],
      output_tokens: number[]
    }> = {}

    // Get the date 14 days ago
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    // Initialize all days in the past 2 weeks
    for (let i = 0; i <= 14; i++) {
      const date = new Date(twoWeeksAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dateTokens[dateStr] = { input_tokens: [], output_tokens: [] }
    }

    // Collect token data for each day
    data.forEach(item => {
      if (item.status === 'complete' && item.tokens) {
        const date = new Date(item.created_at)
        // Only count if within the last 2 weeks
        if (date >= twoWeeksAgo) {
          const dateStr = date.toISOString().split('T')[0]
          if (dateTokens[dateStr]) {
            // Input tokens = prompt tokens
            dateTokens[dateStr].input_tokens.push(item.tokens.prompt_token_count || 0)
            // Output tokens = candidates + thoughts
            const outputTokens = (item.tokens.candidates_token_count || 0) + (item.tokens.thoughts_token_count || 0)
            dateTokens[dateStr].output_tokens.push(outputTokens)
          }
        }
      }
    })

    // Calculate daily totals (sum of all tokens for that day)
    const result: DailyTokenData[] = []
    Object.entries(dateTokens).forEach(([date, tokens]) => {
      const inputTotal = tokens.input_tokens.reduce((sum, val) => sum + val, 0)
      const outputTotal = tokens.output_tokens.reduce((sum, val) => sum + val, 0)
      
      result.push({
        date,
        input_tokens: inputTotal,
        output_tokens: outputTotal
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
          <CardTitle>Token Usage Trends</CardTitle>
          <CardDescription>
            Daily input and output token consumption
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
    input_tokens: {
      label: "Input Tokens",
      color: "#3b82f6",
    },
    output_tokens: {
      label: "Output Tokens",
      color: "#8b5cf6",
    },
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Token Usage Trends</CardTitle>
        <CardDescription>
          Daily input and output token consumption
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        'input_tokens': 'Input Tokens',
                        'output_tokens': 'Output Tokens',
                      }
                      return [Number(value).toLocaleString(), labels[name] || name]
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="input_tokens"
                type="monotone"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Input Tokens"
              />
              <Line
                dataKey="output_tokens"
                type="monotone"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="Output Tokens"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
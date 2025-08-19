"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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
  avg_input_tokens: number
  avg_output_tokens: number
  min_input_tokens: number
  min_output_tokens: number
  max_input_tokens: number
  max_output_tokens: number
}

export function TokenTrendsChart({ data, loading }: { data: Extraction[], loading?: boolean }) {
  // Process data to calculate daily token usage with candlestick data
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

    // Calculate daily candlestick data (open, high, low, close)
    const result: DailyTokenData[] = []
    Object.entries(dateTokens).forEach(([date, tokens]) => {
      const inputValues = tokens.input_tokens
      const outputValues = tokens.output_tokens
      
      // For candlestick, we need OHLC data - for simplicity, we'll use:
      // Open: first value of the day (or 0 if none)
      // High: max value of the day
      // Low: min value of the day (or 0 if none)
      // Close: last value of the day (or 0 if none)
      
      const inputOpen = inputValues.length > 0 ? inputValues[0] : 0
      const inputHigh = inputValues.length > 0 ? Math.max(...inputValues) : 0
      const inputLow = inputValues.length > 0 ? Math.min(...inputValues) : 0
      const inputClose = inputValues.length > 0 ? inputValues[inputValues.length - 1] : 0
      
      const outputOpen = outputValues.length > 0 ? outputValues[0] : 0
      const outputHigh = outputValues.length > 0 ? Math.max(...outputValues) : 0
      const outputLow = outputValues.length > 0 ? Math.min(...outputValues) : 0
      const outputClose = outputValues.length > 0 ? outputValues[outputValues.length - 1] : 0
      
      // We'll store the OHLC data in our existing structure
      // For simplicity, we'll use the high/low values to represent the range
      result.push({
        date,
        input_tokens: inputHigh, // Using high for main value
        output_tokens: outputHigh, // Using high for main value
        avg_input_tokens: inputLow, // Using low for secondary value
        avg_output_tokens: outputLow, // Using low for secondary value
        min_input_tokens: inputOpen, // Using open for another dimension
        min_output_tokens: outputOpen, // Using open for another dimension
        max_input_tokens: inputClose, // Using close for another dimension
        max_output_tokens: outputClose // Using close for another dimension
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
      label: "Input Tokens (High)",
      color: "hsl(var(--chart-1))",
    },
    output_tokens: {
      label: "Output Tokens (High)",
      color: "hsl(var(--chart-2))",
    },
    avg_input_tokens: {
      label: "Input Tokens (Low)",
      color: "hsl(var(--chart-3))",
    },
    avg_output_tokens: {
      label: "Output Tokens (Low)",
      color: "hsl(var(--chart-4))",
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
              <CartesianGrid strokeDasharray="3 3" />
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
                  />
                } 
              />
              {/* Input Tokens - High/Low range */}
              <Line
                type="monotone"
                dataKey="input_tokens"
                stroke="var(--color-input_tokens)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-input_tokens)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-input_tokens)', strokeWidth: 2 }}
                name="Input Tokens (High)"
              />
              <Line
                type="monotone"
                dataKey="avg_input_tokens"
                stroke="var(--color-avg_input_tokens)"
                strokeWidth={1}
                dot={{ fill: 'var(--color-avg_input_tokens)', strokeWidth: 1, r: 2 }}
                activeDot={{ r: 4, stroke: 'var(--color-avg_input_tokens)', strokeWidth: 1 }}
                name="Input Tokens (Low)"
              />
              
              {/* Output Tokens - High/Low range */}
              <Line
                type="monotone"
                dataKey="output_tokens"
                stroke="var(--color-output_tokens)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-output_tokens)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-output_tokens)', strokeWidth: 2 }}
                name="Output Tokens (High)"
              />
              <Line
                type="monotone"
                dataKey="avg_output_tokens"
                stroke="var(--color-avg_output_tokens)"
                strokeWidth={1}
                dot={{ fill: 'var(--color-avg_output_tokens)', strokeWidth: 1, r: 2 }}
                activeDot={{ r: 4, stroke: 'var(--color-avg_output_tokens)', strokeWidth: 1 }}
                name="Output Tokens (Low)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
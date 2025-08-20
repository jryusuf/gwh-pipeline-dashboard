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

interface DailyTokenData {
  date: string
  input_open: number
  input_high: number
  input_low: number
  input_close: number
  output_open: number
  output_high: number
  output_low: number
  output_close: number
}

// Custom candlestick bar component for input tokens
const InputCandlestickBar = (props: any) => {
  const { x, y, width, height, input_open, input_close, input_high, input_low } = props
  const isUp = input_close >= input_open
  const color = isUp ? "#3b82f6" : "#3b82f6"
  const highLowColor = "#94a3b8"
  
  // Calculate the body dimensions
  const bodyHeight = Math.abs(input_close - input_open)
  const bodyY = Math.min(input_open, input_close)
  
  return (
    <g>
      {/* High-Low line */}
      <line
        x1={x + width / 2}
        y1={input_high}
        x2={x + width / 2}
        y2={input_low}
        stroke={highLowColor}
        strokeWidth={1}
      />
      {/* Open-Close body */}
      <rect
        x={x + 1}
        y={bodyY}
        width={width - 2}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

// Custom candlestick bar component for output tokens
const OutputCandlestickBar = (props: any) => {
  const { x, y, width, height, output_open, output_close, output_high, output_low } = props
  const isUp = output_close >= output_open
  const color = isUp ? "#8b5cf6" : "#8b5cf6"
  const highLowColor = "#94a3b8"
  
  // Calculate the body dimensions
  const bodyHeight = Math.abs(output_close - output_open)
  const bodyY = Math.min(output_open, output_close)
  
  return (
    <g>
      {/* High-Low line */}
      <line
        x1={x + width / 2}
        y1={output_high}
        x2={x + width / 2}
        y2={output_low}
        stroke={highLowColor}
        strokeWidth={1}
      />
      {/* Open-Close body */}
      <rect
        x={x + 1}
        y={bodyY}
        width={width - 2}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
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
      
      // For candlestick, we need OHLC data
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
      
      result.push({
        date,
        input_open: inputOpen,
        input_high: inputHigh,
        input_low: inputLow,
        input_close: inputClose,
        output_open: outputOpen,
        output_high: outputHigh,
        output_low: outputLow,
        output_close: outputClose
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
          Daily input and output token consumption (OHLC)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2} barSize={8}>
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
                        'input_open': 'Input Open',
                        'input_high': 'Input High',
                        'input_low': 'Input Low',
                        'input_close': 'Input Close',
                        'output_open': 'Output Open',
                        'output_high': 'Output High',
                        'output_low': 'Output Low',
                        'output_close': 'Output Close',
                      }
                      return [Number(value).toLocaleString(), labels[name] || name]
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="input_open"
                fill="#3b82f6"
                shape={<InputCandlestickBar />}
                name="Input Tokens"
              />
              <Bar
                dataKey="output_open"
                fill="#8b5cf6"
                shape={<OutputCandlestickBar />}
                name="Output Tokens"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
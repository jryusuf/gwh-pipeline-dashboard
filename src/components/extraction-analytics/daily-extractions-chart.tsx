"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface Extraction {
  id: string
  created_at: string
  status: string
  tokens: any
}

interface DailyExtractionData {
  date: string
  started: number
  complete: number
}

export function DailyExtractionsChart({ data, loading }: { data: Extraction[], loading?: boolean }) {
  // Process data to count by status for each day (last 2 weeks)
  const processData = (): DailyExtractionData[] => {
    const dateCounts: Record<string, { total: number, complete: number }> = {}

    // Get the date 14 days ago
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    // Initialize all days in the past 2 weeks with 0 counts
    for (let i = 0; i <= 14; i++) {
      const date = new Date(twoWeeksAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dateCounts[dateStr] = { total: 0, complete: 0 }
    }

    // Count the actual data
    data.forEach(item => {
      const date = new Date(item.created_at)
      // Only count if within the last 2 weeks
      if (date >= twoWeeksAgo) {
        const dateStr = date.toISOString().split('T')[0]
        if (dateCounts[dateStr]) {
          // Count all extractions as total
          dateCounts[dateStr].total += 1
          // Count completed extractions
          if (item.status === 'complete') {
            dateCounts[dateStr].complete += 1
          }
        }
      }
    })

    // Convert to array and sort by date
    return Object.entries(dateCounts)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const chartData = processData()

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Extractions</CardTitle>
          <CardDescription>
            Extraction counts by status for the last 14 days
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
    total: {
      label: "Total Extractions",
      color: "hsl(var(--chart-1))",
    },
    complete: {
      label: "Completed Extractions",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Extractions</CardTitle>
        <CardDescription>
          Extraction counts by status for the last 14 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="complete"
                fill="var(--color-complete)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
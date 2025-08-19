"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ScrapeResult {
  id: string
  extraction_status: string | null
  created_at: string
  // Add other fields as needed
}

interface DailyStatusCount {
  date: string
  started: number
  complete: number
  pending: number
}

export function ScrapeResultsChart({ data }: { data: ScrapeResult[] }) {
  // Process data to count by extraction_status for each day (last 2 weeks)
  const processData = (): DailyStatusCount[] => {
    const dateCounts: Record<string, { started: number, complete: number, pending: number }> = {}

    // Get the date 14 days ago
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    // Initialize all days in the past 2 weeks with 0 counts
    for (let i = 0; i <= 14; i++) {
      const date = new Date(twoWeeksAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dateCounts[dateStr] = { started: 0, complete: 0, pending: 0 }
    }

    // Count the actual data
    data.forEach(item => {
      const date = new Date(item.created_at)
      // Only count if within the last 2 weeks
      if (date >= twoWeeksAgo) {
        const dateStr = date.toISOString().split('T')[0]
        if (dateCounts[dateStr]) {
          if (item.extraction_status === 'started') {
            dateCounts[dateStr].started += 1
          } else if (item.extraction_status === 'complete') {
            dateCounts[dateStr].complete += 1
          } else {
            dateCounts[dateStr].pending += 1
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

  const chartConfig = {
    started: {
      label: "Started",
      color: "hsl(var(--chart-1))",
    },
    complete: {
      label: "Complete",
      color: "hsl(var(--chart-2))",
    },
    pending: {
      label: "Pending",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Extraction Status Over Time</CardTitle>
        <CardDescription>
          Daily counts of markdown extractions for the last 2 weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full [&_.pending-bar]:fill-[#6366f1] [&_.started-bar]:fill-[#10b981] [&_.complete-bar]:fill-[#f59e0b]">
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
                dataKey="pending" 
                stackId="a" 
                fill={chartConfig.pending.color} 
                radius={[0, 0, 0, 0]}
                className="pending-bar"
              />
              <Bar 
                dataKey="started" 
                stackId="a" 
                fill={chartConfig.started.color} 
                radius={[0, 0, 0, 0]}
                className="started-bar"
              />
              <Bar 
                dataKey="complete" 
                stackId="a" 
                fill={chartConfig.complete.color} 
                radius={[4, 4, 0, 0]}
                className="complete-bar"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

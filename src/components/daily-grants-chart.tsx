"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RawGrant {
  id: string
  created_at: string
  // Add other fields as needed
}

interface DailyCount {
  date: string
  count: number
}

export function DailyGrantsChart({ data }: { data: RawGrant[] }) {

  // Process data to count by day
  const processData = (): DailyCount[] => {
    const dateCounts: Record<string, number> = {}

    // Get the date 14 days ago
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    // Initialize all days in the past 2 weeks with 0 counts
    for (let i = 0; i <= 14; i++) {
      const date = new Date(twoWeeksAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dateCounts[dateStr] = 0
    }

    // Count the actual data
    data.forEach(item => {
      const date = new Date(item.created_at)
      // Only count if within the last 2 weeks
      if (date >= twoWeeksAgo) {
        const dateStr = date.toISOString().split('T')[0]
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
      }
    })

    // Convert to array and sort by date
    const result = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return result
  }

  const chartData = processData()

  const chartConfig = {
    count: {
      label: "Grants Count",
      color: "#f59e0b",
    },
    date: {
      label: "Date",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Grants Discovery</CardTitle>
        <CardDescription>
          Number of grants discovered each day for the past 2 weeks
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
                dataKey="count" 
                fill="var(--color-count)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

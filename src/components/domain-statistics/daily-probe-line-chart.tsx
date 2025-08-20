"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DailyProbeCount {
  probe_date: string
  probe_count: number
}

export function DailyProbeLineChart({ data }: { data: DailyProbeCount[] }) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const chartConfig = {
    probe_count: {
      label: "Probed Domains",
      color: "#3b82f6",
    },
    date: {
      label: "Date",
      color: "hsl(var(--chart-2))",
    },
  }

  if (!isClient) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Probe Activity</CardTitle>
          <CardDescription>
            Number of domains probed each day (last 14 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] w-full flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Probe Activity</CardTitle>
        <CardDescription>
          Number of domains probed each day (last 14 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="probe_date"
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
              <Line
                type="monotone"
                dataKey="probe_count"
                stroke="var(--color-probe_count)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-probe_count)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-probe_count)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
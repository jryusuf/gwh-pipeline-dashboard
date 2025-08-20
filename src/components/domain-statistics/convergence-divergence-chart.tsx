"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ConvergenceDivergenceData {
  date: string
  discovered_count: number
  probed_count: number
}

export function ConvergenceDivergenceChart({ data }: { data: ConvergenceDivergenceData[] }) {
  const chartConfig = {
    discovered_count: {
      label: "Discovered Domains",
      color: "#3b82f6", // blue
    },
    probed_count: {
      label: "Probed Domains", 
      color: "#10b981", // green
    },
    date: {
      label: "Date",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Domain Discovery vs Probe Convergence</CardTitle>
        <CardDescription>
          Comparison of daily discovered domains vs daily probed domains (last 14 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
              <Legend 
                verticalAlign="top"
                height={36}
              />
              <Line 
                type="monotone" 
                dataKey="discovered_count" 
                name="Discovered Domains"
                stroke="var(--color-discovered_count)" 
                strokeWidth={2}
                dot={{ fill: 'var(--color-discovered_count)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-discovered_count)', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="probed_count" 
                name="Probed Domains"
                stroke="var(--color-probed_count)" 
                strokeWidth={2}
                dot={{ fill: 'var(--color-probed_count)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-probed_count)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
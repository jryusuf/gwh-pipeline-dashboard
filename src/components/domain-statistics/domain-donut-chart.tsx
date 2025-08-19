"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DomainStats {
  total_domains: number
  never_probed: number
  probed: number
}

const COLORS = ["#10b981", "#ef4444", "#94a3b8"]

export function DomainDonutChart({ data }: { data: DomainStats | null }) {
  const chartData = data ? [
    { name: "Probed Domains", value: data.probed },
    { name: "Never Probed", value: data.never_probed },
  ] : []

  const chartConfig = {
    probed: {
      label: "Probed Domains",
      color: "#10b981",
    },
    never_probed: {
      label: "Never Probed",
      color: "#ef4444",
    },
  }

  const total = data ? data.probed + data.never_probed : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Domain Probe Status</CardTitle>
        <CardDescription>
          Distribution of probed vs never probed domains
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip 
                content={<ChartTooltipContent />} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Total Domains: {total.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
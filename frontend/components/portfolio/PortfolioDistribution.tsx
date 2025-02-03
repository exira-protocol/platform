"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { usePortfolioData } from "@/hooks/usePortfolioData";

// Define colors for share types
const shareColors: Record<string, string> = {
  EXEMB: "#0088FE", // Blue
  EMBO: "#00C49F", // Green
  MIND: "#FFBB28", // Yellow
  BROK: "#FF8042", // Orange
};

export function PortfolioDistribution() {
  const { distributionData } = usePortfolioData();

  // Convert object format { EXEMB: 2 } → array format [{ name: "EXEMB", value: 2 }]
  const chartData = Object.entries(distributionData).map(
    ([shareSymbol, quantity]) => ({
      name: shareSymbol,
      value: quantity,
      color: shareColors[shareSymbol] || "#8884d8", // Default color if not found
    })
  );

  return (
    <Card>
      <CardHeader className="bg-gray-100 dark:bg-gray-800 rounded-t-lg">
        <CardTitle className="text-base font-medium">
          Portfolio Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} Shares`, "Holdings"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

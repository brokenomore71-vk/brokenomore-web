"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { IconChartBar, IconTrendingUp, IconTrendingDown, IconUsers, IconCreditCard } from "@tabler/icons-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("90d");
  const [metrics, setMetrics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
      };

      // Fetch all analytics data in parallel
      const [metricsRes, revenueRes, usersRes] = await Promise.all([
        fetch(`/api/admin/analytics/metrics`, { headers }),
        fetch(`/api/admin/analytics/revenue?period=${selectedPeriod}`, { headers }),
        fetch(`/api/admin/analytics/users?period=${selectedPeriod}`, { headers }),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (revenueRes.ok) {
        const revenue = await revenueRes.json();
        setRevenueData(revenue.data || []);
      }

      if (usersRes.ok) {
        const users = await usersRes.json();
        setUserGrowthData(users.data || []);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View insights and statistics about your platform
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["7d", "30d", "90d", "1y"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition flex-1 sm:flex-none ${
                selectedPeriod === period
                  ? "bg-[#6B46C1] text-white"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              {period === "7d" ? "7 days" : period === "30d" ? "30 days" : period === "90d" ? "90 days" : "1 year"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <IconUsers className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              {metrics?.revenueChange !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  metrics.revenueChange >= 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {metrics.revenueChange >= 0 ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
                  {metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange?.toFixed(1) || 0}%
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ₹{metrics?.totalRevenue?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <IconCreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              {metrics?.subscriptionChange !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  metrics.subscriptionChange >= 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {metrics.subscriptionChange >= 0 ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
                  {metrics.subscriptionChange >= 0 ? '+' : ''}{metrics.subscriptionChange?.toFixed(1) || 0}%
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Subscriptions</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {metrics?.activeSubscriptions?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <IconChartBar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {metrics?.conversionRate?.toFixed(1) || '0'}%
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <IconChartBar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              {metrics?.arpuChange !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  metrics.arpuChange >= 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {metrics.arpuChange >= 0 ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
                  {metrics.arpuChange >= 0 ? '+' : ''}{metrics.arpuChange?.toFixed(1) || 0}%
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">ARPU</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ₹{metrics?.arpu?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="mb-8">
        <ChartAreaInteractive period={selectedPeriod} revenueData={revenueData} userGrowthData={userGrowthData} />
      </div>
    </div>
  );
}

const defaultChartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
];

const chartConfig = {
  visitors: {
    label: "Data",
  },
  desktop: {
    label: "Revenue (₹)",
    color: "#6B46C1",
  },
  mobile: {
    label: "Subscriptions",
    color: "#8648d0",
  },
} satisfies ChartConfig;

function ChartAreaInteractive({ period, revenueData, userGrowthData }: { period: string; revenueData: any[]; userGrowthData: any[] }) {
  const [timeRange, setTimeRange] = React.useState("90d");

  // Use real data if available, otherwise use default
  const chartData = revenueData.length > 0 ? revenueData.map((item: any) => ({
    date: item.date,
    desktop: item.revenue || 0,
    mobile: item.subscriptions || 0,
  })) : defaultChartData;

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  React.useEffect(() => {
    setTimeRange(period);
  }, [period]);

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Revenue & Subscriptions</CardTitle>
          <CardDescription>
            Showing revenue and subscription data for selected period
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

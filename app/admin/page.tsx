"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  IconUsers,
  IconCreditCard,
  IconReceipt,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
} from "@tabler/icons-react";

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenueRupees: number;
  revenueChange: number;
  totalTransactions: number;
  userGrowth: number;
}

interface Activity {
  type: 'subscription' | 'purchase' | 'signup';
  id: string;
  user_email: string;
  user_name?: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/activity?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load activities:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadActivities()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session) {
        await Promise.all([loadStats(), loadActivities()]);
      }
      setLoading(false);
    };

    initialize();

    // Set up real-time subscriptions
    const subscriptions = supabase
      .channel('admin-dashboard-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_profiles' },
        () => {
          loadStats();
          loadActivities();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'subscriptions' },
        () => {
          loadStats();
          loadActivities();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: 'status=eq.active' },
        () => {
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'credit_purchases' },
        () => {
          loadStats();
          loadActivities();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'credit_transactions' },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      subscriptions.unsubscribe();
    };
  }, [loadStats, loadActivities]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <IconCreditCard className="h-5 w-5 text-green-600" />;
      case 'purchase':
        return <IconReceipt className="h-5 w-5 text-blue-600" />;
      case 'signup':
        return <IconUsers className="h-5 w-5 text-purple-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Welcome back, {user?.email}
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition disabled:opacity-50 w-full sm:w-auto"
        >
          <IconRefresh className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Users
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                {stats?.totalUsers?.toLocaleString() || '0'}
              </p>
              {stats?.userGrowth !== undefined && (
                <div className="flex items-center gap-1 mt-1 sm:mt-2 flex-wrap">
                  {stats.userGrowth >= 0 ? (
                    <IconTrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <IconTrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  )}
                  <span className={`text-xs ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:inline">vs last month</span>
                </div>
              )}
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0 ml-2">
              <IconUsers className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Subscriptions
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                {stats?.activeSubscriptions?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0 ml-2">
              <IconCreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                ₹{stats?.totalRevenueRupees?.toLocaleString() || '0'}
              </p>
              {stats?.revenueChange !== undefined && (
                <div className="flex items-center gap-1 mt-1 sm:mt-2 flex-wrap">
                  {stats.revenueChange >= 0 ? (
                    <IconTrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  ) : (
                    <IconTrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  )}
                  <span className={`text-xs ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:inline">vs last month</span>
                </div>
              )}
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0 ml-2">
              <IconChartBar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                {stats?.totalTransactions?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0 ml-2">
              <IconReceipt className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        {activities.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
            <p className="text-sm sm:text-base">No recent activity to display</p>
            <p className="text-xs sm:text-sm mt-2">
              Activity will appear here as users interact with the platform
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                        {activity.user_email}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

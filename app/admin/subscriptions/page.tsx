"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { IconCreditCard, IconSearch, IconCheck, IconX } from "@tabler/icons-react";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadSubscriptions();
  }, [filter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        filter: filter,
      });

      const response = await fetch(`/api/admin/subscriptions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load subscriptions:', response.status, errorData);
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Subscriptions
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          View and manage all active and past subscriptions
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search subscriptions by user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadSubscriptions();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 sm:gap-4 min-w-max sm:min-w-0">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 ${
                filter === "all"
                  ? "bg-[#6B46C1] text-white"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 ${
                filter === "active"
                  ? "bg-[#6B46C1] text-white"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("expired")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 ${
                filter === "expired"
                  ? "bg-[#6B46C1] text-white"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Expired
            </button>
            <button
              onClick={() => setFilter("cancelled")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 ${
                filter === "cancelled"
                  ? "bg-[#6B46C1] text-white"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <IconCreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">No subscriptions found</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-2">
              Subscriptions will appear here once users purchase plans
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-800">
                  {subscriptions
                    .filter((subscription) => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        subscription.user_email?.toLowerCase().includes(search) ||
                        subscription.user_name?.toLowerCase().includes(search)
                      );
                    })
                    .map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscription.user_email || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{subscription.plan_display || subscription.plan || "Pro"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscription.status === "active" || subscription.status === "trialing" ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                            <IconCheck className="h-3 w-3" />
                            Active
                          </span>
                        ) : subscription.status === "expired" ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 flex items-center gap-1">
                            <IconX className="h-3 w-3" />
                            Expired
                          </span>
                        ) : subscription.status === "cancelled" ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 flex items-center gap-1">
                            <IconX className="h-3 w-3" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
                            <IconX className="h-3 w-3" />
                            {subscription.status || "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₹{subscription.amount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {subscription.started_at ? new Date(subscription.started_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-[#6B46C1] hover:text-[#553C9A]">
                          View Details
                        </button>
                      </td>
                    </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-neutral-800">
              {subscriptions
                .filter((subscription) => {
                  if (!searchTerm) return true;
                  const search = searchTerm.toLowerCase();
                  return (
                    subscription.user_email?.toLowerCase().includes(search) ||
                    subscription.user_name?.toLowerCase().includes(search)
                  );
                })
                .map((subscription) => (
                <div key={subscription.id} className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                        {subscription.user_email || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {subscription.plan_display || subscription.plan || "Pro"} Plan
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {subscription.status === "active" || subscription.status === "trialing" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                          <IconCheck className="h-3 w-3" />
                          Active
                        </span>
                      ) : subscription.status === "expired" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 flex items-center gap-1">
                          <IconX className="h-3 w-3" />
                          Expired
                        </span>
                      ) : subscription.status === "cancelled" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 flex items-center gap-1">
                          <IconX className="h-3 w-3" />
                          Cancelled
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
                          <IconX className="h-3 w-3" />
                          {subscription.status || "Inactive"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{subscription.amount || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Start Date</div>
                      <div className="text-xs text-gray-900 dark:text-white">
                        {subscription.started_at ? new Date(subscription.started_at).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Ends: {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : "N/A"}
                    </div>
                    <button className="text-xs text-[#6B46C1] hover:text-[#553C9A] font-medium">
                      View Details
                    </button>
                  </div>
                </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

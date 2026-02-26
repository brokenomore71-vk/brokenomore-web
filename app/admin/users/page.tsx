"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { IconUsers, IconSearch, IconFilter, IconEye, IconRefresh, IconX } from "@tabler/icons-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  credit_balance: number;
  plan_type: 'free' | 'pro' | 'none';
  subscription: {
    plan: string;
    status: string;
    ends_at: string | null;
  } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadUsers = useCallback(async (search: string = searchTerm, plan: string = planFilter, pageNum: number = page) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (search) {
        params.append('search', search);
      }
      if (plan !== 'all') {
        params.append('plan', plan);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load users:', response.status, errorData);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, planFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Set up real-time subscription for new users
  useEffect(() => {
    const subscription = supabase
      .channel('admin-users-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_profiles' },
        () => {
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUsers]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    loadUsers(value, planFilter, 1);
  };

  const handlePlanFilter = (plan: string) => {
    setPlanFilter(plan);
    setPage(1);
    loadUsers(searchTerm, plan, 1);
  };

  const loadUserDetails = async (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingDetails(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load user details:', response.status, errorData);
        alert(`Failed to load user details: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Error loading user details. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Users
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Manage and view all registered users
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchTerm);
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={planFilter}
              onChange={(e) => handlePlanFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-neutral-800"
            >
              <option value="all">All Plans</option>
              <option value="pro">Pro Plan</option>
              <option value="free">Free Plan</option>
              <option value="none">No Plan</option>
            </select>
            <button
              onClick={() => loadUsers()}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
            >
              <IconRefresh className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table/Cards */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <IconUsers className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">No users found</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-2">
              Users will appear here once they register
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
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                              {user.email?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.plan_type === 'pro' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : user.plan_type === 'free'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {user.plan_type === 'pro' ? 'Pro' : user.plan_type === 'free' ? 'Free' : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.credit_balance || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => loadUserDetails(user)}
                          className="text-[#6B46C1] hover:text-[#553C9A]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-neutral-800">
              {users.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          {user.email?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.full_name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Plan</div>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.plan_type === 'pro' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : user.plan_type === 'free'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {user.plan_type === 'pro' ? 'Pro' : user.plan_type === 'free' ? 'Free' : 'None'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Credits</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {user.credit_balance || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }) : "N/A"}
                    </div>
                    <button
                      onClick={() => loadUserDetails(user)}
                      className="text-sm text-[#6B46C1] hover:text-[#553C9A] font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  loadUsers(searchTerm, planFilter, newPage);
                }}
                disabled={page === 1}
                className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  loadUsers(searchTerm, planFilter, newPage);
                }}
                disabled={page >= totalPages}
                className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowUserModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                User Details
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading user details...</p>
              </div>
            ) : userDetails ? (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Profile Info */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-white">{userDetails.profile?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                      <p className="text-gray-900 dark:text-white">{userDetails.profile?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Credit Balance</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{userDetails.credit_balance || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
                      <p className="text-gray-900 dark:text-white">
                        {userDetails.profile?.created_at ? new Date(userDetails.profile.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                {userDetails.subscriptions && userDetails.subscriptions.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Subscriptions</h3>
                    <div className="space-y-2">
                      {userDetails.subscriptions.map((sub: any, idx: number) => (
                        <div key={idx} className="p-3 sm:p-4 border border-gray-200 dark:border-neutral-800 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{sub.plan} Plan</p>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Status: {sub.status}</p>
                            </div>
                            {sub.ends_at && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                Ends: {new Date(sub.ends_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                {userDetails.transactions && userDetails.transactions.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Recent Transactions</h3>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <table className="min-w-full text-xs sm:text-sm">
                          <thead className="bg-gray-50 dark:bg-neutral-800">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs">Date</th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs">Type</th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs">Amount</th>
                              <th className="px-2 sm:px-4 py-2 text-left text-xs hidden sm:table-cell">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                            {userDetails.transactions.slice(0, 10).map((trans: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                                  {new Date(trans.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    trans.transaction_type === 'purchase' || trans.transaction_type === 'bonus'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {trans.transaction_type}
                                  </span>
                                </td>
                                <td className={`px-2 sm:px-4 py-2 font-medium whitespace-nowrap ${
                                  trans.amount > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {trans.amount > 0 ? '+' : ''}{trans.amount}
                                </td>
                                <td className="px-2 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                                  {trans.description || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

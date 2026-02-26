"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creditsData, setCreditsData] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';

  useEffect(() => {
    checkAuth();
  }, []);

  // Log subscription changes for debugging
  useEffect(() => {
    console.log('📊 Subscription state updated:', subscription);
  }, [subscription]);

  // Check for pending subscription after user is loaded
  useEffect(() => {
    if (user) {
      const pendingSubscriptionId = localStorage.getItem('pending_subscription_id');
      const subscriptionStatus = localStorage.getItem('subscription_status');
      
      if (pendingSubscriptionId) {
        console.log('\n🔄 ===== DASHBOARD: PENDING SUBSCRIPTION DETECTED =====');
        console.log('🆔 Subscription ID:', pendingSubscriptionId);
        console.log('📊 Stored Status:', subscriptionStatus);
        console.log('👤 User ID:', user.id);
        console.log('📅 Timestamp:', new Date().toISOString());
        
        // If status is 'created', poll for status updates
        if (subscriptionStatus === 'created') {
          console.log('⏳ Subscription in "created" state, starting polling...');
          pollSubscriptionStatus(pendingSubscriptionId);
        } else {
          console.log('⏱️ Subscription status:', subscriptionStatus, '- Refreshing data in 3 seconds...');
          // Refresh credits data after a short delay to allow webhook to process
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                console.log('🔄 Refreshing credits data...');
                loadCreditsData(session.access_token);
              }
            });
          }, 3000); // Wait 3 seconds for webhook to process
        }
      } else {
        console.log('✅ No pending subscription found');
      }
    }
  }, [user]);

  const pollSubscriptionStatus = async (subscriptionId: string) => {
    console.log('🔄 Starting subscription status polling from dashboard...');
    console.log('🆔 Subscription ID:', subscriptionId);
    
    let attempts = 0;
    const maxAttempts = 15; // Poll for up to 30 seconds (15 attempts * 2 seconds)

    const checkStatus = async () => {
      attempts++;
      console.log(`\n🔄 [DASHBOARD POLL] Attempt ${attempts}/${maxAttempts}`);
      console.log('🆔 [DASHBOARD POLL] Subscription ID:', subscriptionId);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('❌ [DASHBOARD POLL] No session found');
          return;
        }

        console.log('📡 [DASHBOARD POLL] Calling check-subscription API...');
        const response = await fetch('/api/razorpay/check-subscription', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription_id: subscriptionId }),
        });

        console.log('📡 [DASHBOARD POLL] API Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [DASHBOARD POLL] Subscription status check result:', {
            status: data.status,
            plan_id: data.plan_id,
            paid_count: data.paid_count,
            total_count: data.total_count,
            in_database: data.in_database,
            database_status: data.database_status,
          });
          
          // Update stored status
          localStorage.setItem('subscription_status', data.status);

          // If subscription is authenticated or active, refresh credits data
          if (data.status === 'authenticated' || data.status === 'active') {
            console.log('Subscription is authenticated/active, refreshing data...');
            
            // Force refresh credits data multiple times to ensure it updates
            await loadCreditsData(session.access_token);
            await loadSubscription(session.access_token);
            
            // Wait a bit and refresh again to ensure database changes are reflected
            setTimeout(async () => {
              const { data: { session: newSession } } = await supabase.auth.getSession();
              if (newSession) {
                console.log('Refreshing credits data again after delay...');
                await loadCreditsData(newSession.access_token);
                await loadSubscription(newSession.access_token);
              }
            }, 2000);
            
            // Clear pending subscription after successful activation
            if (data.in_database) {
              localStorage.removeItem('pending_subscription_id');
              localStorage.removeItem('subscription_status');
            }
            return; // Stop polling
          }

          // If subscription is cancelled or expired, stop polling
          if (data.status === 'cancelled' || data.status === 'expired') {
            console.log('Subscription cancelled/expired, stopping poll');
            localStorage.removeItem('pending_subscription_id');
            localStorage.removeItem('subscription_status');
            return;
          }

          // Continue polling if still in 'created' state
          attempts++;
          if (attempts < maxAttempts && data.status === 'created') {
            setTimeout(checkStatus, 2000); // Check every 2 seconds
          } else if (attempts >= maxAttempts) {
            console.log('Max polling attempts reached, refreshing data anyway...');
            await loadCreditsData(session.access_token);
          }
        } else {
          console.error('Failed to check subscription status');
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        }
      }
    };

    // Start polling after initial delay
    setTimeout(checkStatus, 2000);
  };

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // If there's an error (e.g., invalid refresh token), clear the session
        if (error.message?.includes('Refresh Token') || error.message?.includes('JWT')) {
          console.warn('Session error detected, clearing session:', error.message);
          await supabase.auth.signOut();
          router.push('/signin?returnTo=/dashboard');
          return;
        }
        throw error;
      }
      
      if (!session) {
        router.push('/signin?returnTo=/dashboard');
        return;
      }

      setUser(session.user);
      loadCreditsData(session.access_token);
      loadSubscription(session.access_token);
    } catch (error: any) {
      console.error('Error checking auth:', error);
      // Clear session on any error
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore sign out errors
      }
      router.push('/signin?returnTo=/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadCreditsData = async (token: string, retryCount = 0) => {
    try {
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreditsData(data);
        
        // If we have a pending subscription but plan_type is still not 'pro', retry a few times
        const pendingSubscriptionId = localStorage.getItem('pending_subscription_id');
        if (pendingSubscriptionId && data.plan_type !== 'pro' && retryCount < 5) {
          // Retry after 2 seconds
          setTimeout(() => {
            loadCreditsData(token, retryCount + 1);
          }, 2000);
        } else if (pendingSubscriptionId) {
          // Clear pending subscription after checking
          localStorage.removeItem('pending_subscription_id');
        }
      } else {
        console.error('Failed to load credits data');
      }
    } catch (error) {
      console.error('Error loading credits data:', error);
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const loadSubscription = async (token: string) => {
    try {
      console.log('🔄 Loading subscription status...');
      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 Subscription API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subscription data received:', data);
        setSubscription(data);
      } else {
        let errorData;
        try {
          const text = await response.text();
          console.log('📄 Raw error response:', text);
          if (text) {
            errorData = JSON.parse(text);
          } else {
            errorData = { error: 'Empty response body' };
          }
        } catch (parseError) {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          };
        }
        console.error('❌ Failed to load subscription:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        // Set subscription to null if there's an error, but still try to use creditsData as fallback
        setSubscription(null);
      }
    } catch (error) {
      console.error('❌ Error loading subscription:', error);
      setSubscription(null);
    }
  };

  const getPlanLabel = () => {
    console.log('📊 Current subscription state:', subscription);
    if (!subscription || !subscription.plan) {
      // Fallback to creditsData if subscription is not loaded yet
      if (creditsData?.plan_type === 'pro') return 'Pro Plan';
      if (creditsData?.plan_type === 'free') return 'Free Plan';
      return 'Free Plan'; // Default to Free Plan if nothing is found
    }
    if (subscription.plan === 'pro') return 'Pro Plan';
    if (subscription.plan === 'simple') return 'Free Plan';
    return 'Free Plan'; // Default fallback
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div style={{ background: heroGradient }}>
          <Navbar />
        </div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div style={{ background: heroGradient }}>
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>

        {/* Credit Balance Card */}
        <div className="bg-gradient-to-r from-[#6B46C1] to-[#8648d0] rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 mb-2">Current Balance</p>
              <h2 className="text-5xl font-bold mb-2">
                {creditsData?.balance || 0}
              </h2>
              <p className="text-purple-100">credits</p>
            </div>
            <div className="text-right">
              <p className="text-purple-100 mb-2">Current Plan</p>
              <h3 className="text-2xl font-bold mb-2">{getPlanLabel()}</h3>
              {subscription?.ends_at && (
                <p className="text-purple-100 text-sm">
                  Expires: {formatDate(subscription.ends_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/pricing"
            className="bg-white border-2 border-[#6B46C1] text-[#6B46C1] px-6 py-4 rounded-lg font-semibold hover:bg-purple-50 transition text-center"
          >
            View Plans
          </Link>
          {subscription?.plan !== 'pro' ? (
            <Link
              href="/pricing"
              className="bg-[#6B46C1] text-white px-6 py-4 rounded-lg font-semibold hover:bg-[#553C9A] transition text-center"
            >
              Upgrade to Pro
            </Link>
          ) : (
            <button
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                  // Check if there's a pending subscription
                  const pendingSubscriptionId = localStorage.getItem('pending_subscription_id');
                  if (pendingSubscriptionId) {
                    // Check subscription status from Razorpay
                    try {
                      const statusResponse = await fetch('/api/razorpay/check-subscription', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ subscription_id: pendingSubscriptionId }),
                      });
                      
                      if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        console.log('Subscription status:', statusData.status);
                        localStorage.setItem('subscription_status', statusData.status);
                        
                        // If subscription is now authenticated/active, clear pending
                        if (statusData.status === 'authenticated' || statusData.status === 'active') {
                          if (statusData.in_database) {
                            localStorage.removeItem('pending_subscription_id');
                            localStorage.removeItem('subscription_status');
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Error checking subscription status:', error);
                    }
                  }
                  
                  // Refresh credits data
                  await loadCreditsData(session.access_token);
                  await loadSubscription(session.access_token);
                }
              }}
              className="bg-gray-200 text-gray-800 px-6 py-4 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Refresh Status
            </button>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
          
          {creditsData?.transactions && creditsData.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Balance After</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {creditsData.transactions.map((transaction: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            transaction.transaction_type === 'purchase' || transaction.transaction_type === 'bonus'
                              ? 'bg-green-100 text-green-800'
                              : transaction.transaction_type === 'consumption'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">
                        <span
                          className={
                            transaction.amount > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.balance_after || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500">No transactions yet</p>
              <Link
                href="/pricing"
                className="mt-4 inline-block text-[#6B46C1] hover:underline"
              >
                Get started with a plan →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


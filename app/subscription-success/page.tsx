"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "../../lib/supabase";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');
  const [message, setMessage] = useState('Verifying your subscription...');
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/signin?returnTo=/subscription-success');
        return;
      }

      // Get subscription information from URL parameters (Razorpay redirect)
      // Razorpay typically passes: razorpay_subscription_id, razorpay_payment_id, razorpay_signature
      const razorpaySubscriptionId = searchParams.get('razorpay_subscription_id') || 
                                      searchParams.get('subscription_id');
      const razorpayPaymentId = searchParams.get('razorpay_payment_id');
      const razorpaySignature = searchParams.get('razorpay_signature');
      const statusFromUrl = searchParams.get('status'); // Status from Razorpay redirect
      
      // Also check localStorage for pending subscription
      const pendingSubscriptionId = localStorage.getItem('pending_subscription_id');
      const subscriptionId = razorpaySubscriptionId || pendingSubscriptionId;

      console.log('🔄 ===== SUBSCRIPTION SUCCESS PAGE LOADED =====');
      console.log('📍 User returned from Razorpay payment page');
      console.log('📋 URL Parameters received:', {
        razorpaySubscriptionId,
        razorpayPaymentId,
        razorpaySignature: razorpaySignature ? 'Present' : 'Not present',
        statusFromUrl,
        pendingSubscriptionId,
        fullUrl: window.location.href,
      });
      console.log('🔍 Subscription ID to check:', subscriptionId);

      // If we have status from URL, handle it directly
      if (statusFromUrl && (statusFromUrl === 'authenticated' || statusFromUrl === 'active')) {
        console.log('✅ STATUS FROM URL: Subscription status found in URL parameters');
        console.log('📊 Status:', statusFromUrl);
        console.log('💰 Payment ID:', razorpayPaymentId);
        console.log('🔐 Signature:', razorpaySignature ? 'Present' : 'Not present');
        setStatus('success');
        setMessage('Payment successful! Subscription activated. Redirecting to dashboard...');
        
        // Clear pending subscription
        if (subscriptionId) {
          localStorage.removeItem('pending_subscription_id');
          localStorage.removeItem('subscription_status');
        }
        
        // Refresh balance and redirect
        checkBalanceAndRedirect(session.access_token, true);
        return;
      }

      if (!subscriptionId) {
        // No subscription ID, check balance directly
        checkBalanceAndRedirect(session.access_token);
        return;
      }

      // If we have subscription ID from URL (Razorpay redirect), check status immediately
      if (razorpaySubscriptionId) {
        console.log('🚀 SUBSCRIPTION ID FROM URL DETECTED');
        console.log('📞 Checking subscription status immediately from Razorpay API...');
        console.log('🆔 Subscription ID:', subscriptionId);
        checkSubscriptionStatusFromAPI(subscriptionId, session.access_token);
        return;
      }

      // Poll for subscription status from Razorpay (check every 2 seconds, max 15 times = 30 seconds)
      let attempts = 0;
      const maxAttempts = 15;

      console.log('⏳ Starting polling for subscription status...');
      console.log('🔄 Will check every 2 seconds, max', maxAttempts, 'attempts');

      const pollSubscription = async () => {
        attempts++;
        console.log(`\n🔄 Polling attempt ${attempts}/${maxAttempts} for subscription:`, subscriptionId);
        
        try {
          // First check Razorpay subscription status
          const statusResponse = await fetch('/api/razorpay/check-subscription', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscription_id: subscriptionId }),
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('📊 Subscription status from Razorpay API:', statusData.status);
            console.log('📋 Full status data:', {
              status: statusData.status,
              plan_id: statusData.plan_id,
              paid_count: statusData.paid_count,
              total_count: statusData.total_count,
              remaining_count: statusData.remaining_count,
              in_database: statusData.in_database,
              database_status: statusData.database_status,
            });
            
            // Update stored status
            localStorage.setItem('subscription_status', statusData.status);

            // If subscription is authenticated or active, check balance and redirect
            if (statusData.status === 'authenticated' || statusData.status === 'active') {
              console.log('✅ SUBSCRIPTION ACTIVATED! Status:', statusData.status);
              console.log('💰 Paid cycles:', statusData.paid_count, '/', statusData.total_count);
              console.log('🗄️ In database:', statusData.in_database);
              console.log('🧹 Clearing pending subscription from localStorage...');
              
              setStatus('success');
              setMessage('Subscription activated successfully! Redirecting to dashboard...');
              
              // Clear pending subscription
              localStorage.removeItem('pending_subscription_id');
              localStorage.removeItem('subscription_status');
              
              console.log('🔄 Refreshing balance and redirecting to dashboard...');
              // Refresh balance and redirect
              checkBalanceAndRedirect(session.access_token, true);
              return;
            }

            // If subscription is cancelled or expired, show error
            if (statusData.status === 'cancelled' || statusData.status === 'expired') {
              setStatus('error');
              setMessage('Subscription was cancelled or expired. Please try again.');
              localStorage.removeItem('pending_subscription_id');
              localStorage.removeItem('subscription_status');
              setTimeout(() => {
                router.push('/pricing');
              }, 3000);
              return;
            }

            // Continue polling if still in 'created' state
            if (attempts < maxAttempts && statusData.status === 'created') {
              console.log('⏳ Subscription still in "created" state, continuing to poll...');
              console.log('⏱️ Next check in 2 seconds...');
              setTimeout(pollSubscription, 2000);
            } else if (attempts >= maxAttempts) {
              // Max attempts reached, check balance anyway
              console.log('⚠️ Max polling attempts reached');
              console.log('📊 Final status:', statusData.status);
              console.log('🔄 Checking balance anyway...');
              setStatus('pending');
              setMessage('Subscription is being processed. Checking your account...');
              checkBalanceAndRedirect(session.access_token);
            }
          } else {
            // If status check fails, try checking balance directly
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollSubscription, 2000);
            } else {
              checkBalanceAndRedirect(session.access_token);
            }
          }
        } catch (error) {
          console.error('Error polling subscription:', error);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollSubscription, 2000);
          } else {
            checkBalanceAndRedirect(session.access_token);
          }
        }
      };

      // Start polling
      pollSubscription();
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      setStatus('error');
      setMessage('An error occurred. Please check your dashboard.');
      setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatusFromAPI = async (subscriptionId: string, token: string) => {
    console.log('🔍 Checking subscription status from Razorpay API...');
    console.log('🆔 Subscription ID:', subscriptionId);
    
    try {
      const statusResponse = await fetch('/api/razorpay/check-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      console.log('📡 API Response status:', statusResponse.status, statusResponse.statusText);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ API Response received successfully');
        console.log('📊 Subscription status from API:', statusData.status);
        console.log('📋 Complete status data:', {
          subscription_id: statusData.subscription_id,
          status: statusData.status,
          plan_id: statusData.plan_id,
          paid_count: statusData.paid_count,
          total_count: statusData.total_count,
          remaining_count: statusData.remaining_count,
          in_database: statusData.in_database,
          database_status: statusData.database_status,
          current_start: statusData.current_start,
          current_end: statusData.current_end,
        });
        
        // Update stored status
        localStorage.setItem('subscription_status', statusData.status);

        // If subscription is authenticated or active, redirect immediately
        if (statusData.status === 'authenticated' || statusData.status === 'active') {
          console.log('✅ SUBSCRIPTION IS ACTIVE! Status:', statusData.status);
          console.log('💰 Payment cycles:', statusData.paid_count, '/', statusData.total_count);
          console.log('🗄️ Subscription in database:', statusData.in_database);
          console.log('📅 Subscription period:', {
            start: statusData.current_start,
            end: statusData.current_end,
          });
          
          setStatus('success');
          setMessage('Payment successful! Subscription activated. Redirecting to dashboard...');
          
          // Clear pending subscription
          console.log('🧹 Clearing pending subscription from localStorage...');
          localStorage.removeItem('pending_subscription_id');
          localStorage.removeItem('subscription_status');
          
          // Refresh balance and redirect
          console.log('🔄 Refreshing balance and redirecting to dashboard...');
          checkBalanceAndRedirect(token, true);
          return;
        }

        // If subscription is cancelled or expired, show error
        if (statusData.status === 'cancelled' || statusData.status === 'expired') {
          setStatus('error');
          setMessage('Subscription was cancelled or expired. Please try again.');
          localStorage.removeItem('pending_subscription_id');
          localStorage.removeItem('subscription_status');
          setTimeout(() => {
            router.push('/pricing');
          }, 3000);
          return;
        }

        // If still in 'created' state, show pending and check balance
        setStatus('pending');
        setMessage('Subscription is being processed. Checking your account...');
        checkBalanceAndRedirect(token);
      } else {
        // If status check fails, check balance directly
        checkBalanceAndRedirect(token);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      checkBalanceAndRedirect(token);
    }
  };

  const checkBalanceAndRedirect = async (token: string, immediateRedirect = false) => {
    console.log('💰 Checking user balance and subscription status...');
    
    try {
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Balance API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Balance data received:', {
          balance: data.balance,
          plan_type: data.plan_type,
          subscription_end: data.subscription_end,
          free_plan_claimed: data.free_plan_claimed,
        });
        
        // Check if subscription is active
        if (data.plan_type === 'pro' && data.subscription_end) {
          const endDate = new Date(data.subscription_end);
          const isValid = endDate > new Date();
          console.log('📅 Subscription end date:', data.subscription_end);
          console.log('✅ Subscription is valid:', isValid);
          
          if (isValid) {
            if (!immediateRedirect) {
              setStatus('success');
              setMessage('Subscription activated successfully! Redirecting to dashboard...');
            }
            
            console.log('🚀 Redirecting to dashboard in', immediateRedirect ? '1' : '2', 'seconds...');
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              console.log('📍 Navigating to dashboard...');
              router.push('/dashboard');
            }, immediateRedirect ? 1000 : 2000);
            return;
          } else {
            console.log('⚠️ Subscription has expired');
          }
        } else {
          console.log('⚠️ Subscription not yet active in database. Plan type:', data.plan_type);
        }
      } else {
        console.error('❌ Failed to fetch balance:', response.status, response.statusText);
      }

      // If not active yet, show pending and redirect anyway
      if (!immediateRedirect) {
        setStatus('pending');
        setMessage('Subscription is being processed. Redirecting to dashboard...');
      }
      
      setTimeout(() => {
        router.push('/dashboard');
      }, immediateRedirect ? 1000 : 3000);
    } catch (error) {
      console.error('Error checking balance:', error);
      setStatus('pending');
      setMessage('Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div style={{ background: heroGradient }}>
        <Navbar />
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="max-w-md w-full text-center">
          {status === 'checking' && (
            <div>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B46C1] mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Subscription</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-10 w-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
            </div>
          )}

          {status === 'pending' && (
            <div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-10 w-10 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing</h2>
              <p className="text-gray-600 mb-6">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-10 w-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Issue</h2>
              <p className="text-gray-600 mb-6">{message}</p>
            </div>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 bg-[#6B46C1] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#553C9A] transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <div style={{ background: 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)' }}>
          <Navbar />
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B46C1] mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Preparing subscription verification...</p>
          </div>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}


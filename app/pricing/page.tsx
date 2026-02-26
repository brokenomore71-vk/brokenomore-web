"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "../../lib/supabase";

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      order_id: string;
      amount?: number;
      name: string;
      description?: string;
      prefill?: { email?: string };
      handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
      modal?: { ondismiss?: () => void };
    }) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}




export default function Pricing() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimingFree, setClaimingFree] = useState(false);
  const [processingPro, setProcessingPro] = useState(false);
  const [processingProOneMonth, setProcessingProOneMonth] = useState(false);
  const [creditsData, setCreditsData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPaymentProcessingModal, setShowPaymentProcessingModal] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<string | null>(null);
  const [currentSubscriptionStatus, setCurrentSubscriptionStatus] = useState<string>('created');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';

  // Check if user has an active Pro subscription
  const isProSubscribed = subscription?.plan === 'pro' && 
    subscription?.ends_at && 
    new Date(subscription.ends_at) > new Date();

  useEffect(() => {
    checkAuth();
  }, []);

  // Cleanup polling on unmount or when component updates
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        console.log('🧹 Cleaning up polling interval on unmount');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Stop polling when modal is closed manually
  const handleClosePaymentModal = () => {
    console.log('🛑 Payment modal closed manually');
    stopPolling();
    setShowPaymentProcessingModal(false);
    // Don't clear subscription ID - user might want to check dashboard later
  };

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // If there's an error (e.g., invalid refresh token), clear the session
        if (error.message?.includes('Refresh Token') || error.message?.includes('JWT')) {
          console.warn('Session error detected, clearing session:', error.message);
          await supabase.auth.signOut();
          setUser(null);
        } else {
          console.error('Auth error:', error);
        }
      } else {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadCreditsData(session.access_token);
          loadSubscription(session.access_token);
        }
      }
    } catch (error: any) {
      console.error('Error checking auth:', error);
      // Clear session on any error
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore sign out errors
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Stop polling function
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log('🛑 Stopping subscription status polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Activate subscription function
  const activateSubscription = async (subscriptionId: string, token: string) => {
    try {
      console.log('🔄 Activating subscription in database...');
      const response = await fetch('/api/razorpay/activate-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subscription activated successfully:', data);
        
        // Refresh credits data
        await loadCreditsData(token);
        await loadSubscription(token);
        
        // Stop polling
        stopPolling();
        
        // Close payment processing modal
        setShowPaymentProcessingModal(false);
        
        // Show success modal
        setSuccessMessage(`Payment successful! Your Pro Plan subscription is now active. You received ${data.credits_added} credits.`);
        setShowSuccessModal(true);
        
        // Clear subscription tracking
        setCurrentSubscriptionId(null);
        setCurrentSubscriptionStatus('created');
        setPaymentUrl(null);
        setPollingAttempts(0);
        localStorage.removeItem('pending_subscription_id');
        localStorage.removeItem('subscription_status');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Failed to activate subscription:', error);
        throw new Error(error.message || 'Failed to activate subscription');
      }
    } catch (error: any) {
      console.error('❌ Error activating subscription:', error);
      stopPolling();
      setErrorMessage(`Failed to activate subscription: ${error.message}`);
      setShowErrorModal(true);
      setShowPaymentProcessingModal(false);
      return false;
    }
  };

  // Poll subscription status function
  const pollSubscriptionStatus = async (subscriptionId: string, token: string) => {
    const maxAttempts = 30; // 30 attempts * 3 seconds = 90 seconds max
    const pollInterval = 3000; // 3 seconds

    console.log('🔄 Starting subscription status polling...');
    console.log('🆔 Subscription ID:', subscriptionId);
    console.log('⏱️ Poll interval:', pollInterval, 'ms');
    console.log('🔢 Max attempts:', maxAttempts);

    let attempts = 0;
    let previousStatus = 'created';

    const poll = async () => {
      attempts++;
      setPollingAttempts(attempts);
      
      console.log(`\n🔄 [POLL] Attempt ${attempts}/${maxAttempts}`);
      console.log('📊 Previous status:', previousStatus);

      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('❌ No session found, stopping poll');
          stopPolling();
          return;
        }

        // Check subscription status from Razorpay
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
          const currentStatus = statusData.status;
          
          console.log('📊 Current status from Razorpay:', currentStatus);
          console.log('📋 Status details:', {
            status: currentStatus,
            paid_count: statusData.paid_count,
            total_count: statusData.total_count,
            in_database: statusData.in_database,
          });

          // Update current status in state
          setCurrentSubscriptionStatus(currentStatus);

          // Check if status changed to authenticated or active
          if (currentStatus === 'authenticated' || currentStatus === 'active') {
            console.log('✅ SUBSCRIPTION ACTIVATED! Status:', currentStatus);
            console.log('🔄 Triggering database activation...');
            
            // Stop polling
            stopPolling();
            
            // Activate subscription in database
            await activateSubscription(subscriptionId, session.access_token);
            return; // Exit polling
          }

          // Check if subscription was cancelled or expired
          if (currentStatus === 'cancelled' || currentStatus === 'expired') {
            console.log('❌ Subscription cancelled or expired');
            stopPolling();
            setErrorMessage('Subscription was cancelled or expired. Please try again.');
            setShowErrorModal(true);
            setShowPaymentProcessingModal(false);
            setCurrentSubscriptionId(null);
            return;
          }

          // Update previous status
          previousStatus = currentStatus;

          // Continue polling if still in 'created' state and haven't reached max attempts
          if (attempts < maxAttempts && currentStatus === 'created') {
            console.log('⏳ Still in "created" state, continuing to poll...');
            console.log('⏱️ Next check in', pollInterval / 1000, 'seconds...');
            // Continue polling
          } else if (attempts >= maxAttempts) {
            console.log('⚠️ Max polling attempts reached');
            stopPolling();
            setErrorMessage('Payment is taking longer than expected. Please check your dashboard or try again.');
            setShowErrorModal(true);
            setShowPaymentProcessingModal(false);
            setCurrentSubscriptionId(null);
          }
        } else {
          console.error('❌ Failed to check subscription status:', statusResponse.status);
          // Continue polling on error (might be temporary)
          if (attempts < maxAttempts) {
            console.log('⏳ Retrying in', pollInterval / 1000, 'seconds...');
          } else {
            stopPolling();
            setErrorMessage('Unable to verify subscription status. Please check your dashboard.');
            setShowErrorModal(true);
            setShowPaymentProcessingModal(false);
          }
        }
      } catch (error) {
        console.error('❌ Error in polling:', error);
        // Continue polling on error (might be temporary)
        if (attempts < maxAttempts) {
          console.log('⏳ Retrying after error in', pollInterval / 1000, 'seconds...');
        } else {
          stopPolling();
          setErrorMessage('An error occurred while checking subscription status.');
          setShowErrorModal(true);
          setShowPaymentProcessingModal(false);
        }
      }
    };

    // Start polling immediately, then continue at intervals
    poll(); // First check immediately
    
    // Set up interval for subsequent checks
    pollingIntervalRef.current = setInterval(() => {
      if (attempts < maxAttempts) {
        poll();
      } else {
        stopPolling();
      }
    }, pollInterval);
  };

  const loadCreditsData = async (token: string) => {
    try {
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCreditsData(data);
      }
    } catch (error) {
      console.error('Error loading credits data:', error);
    }
  };

  const loadSubscription = async (token: string) => {
    try {
      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };


  const handleFreePlan = async () => {
    if (!user) {
      router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
      return;
    }

    setClaimingFree(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // If there's an error (e.g., invalid refresh token), clear the session
        if (sessionError.message?.includes('Refresh Token') || sessionError.message?.includes('JWT')) {
          await supabase.auth.signOut();
          router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
          return;
        }
        throw sessionError;
      }
      
      if (!session) {
        router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
        return;
      }

      const response = await fetch('/api/credits/claim-free', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(`Free plan activated! You received ${result.credits_added} credits.`);
        setShowSuccessModal(true);
        loadCreditsData(session.access_token);
        loadSubscription(session.access_token);
      } else {
        if (result.already_claimed) {
          setErrorMessage('You have already claimed the free plan.');
        } else {
          setErrorMessage(`Error: ${result.error}`);
        }
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setErrorMessage(`Error: ${error.message}`);
      setShowErrorModal(true);
    } finally {
      setClaimingFree(false);
    }
  };

  const handleProPlan = async () => {
    if (!user) {
      router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
      return;
    }

    setProcessingPro(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // If there's an error (e.g., invalid refresh token), clear the session
        if (sessionError.message?.includes('Refresh Token') || sessionError.message?.includes('JWT')) {
          await supabase.auth.signOut();
          router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
          return;
        }
        throw sessionError;
      }
      
      if (!session) {
        router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
        return;
      }

      console.log('\n🚀 ===== INITIATING PRO PLAN PURCHASE =====');
      console.log('👤 User ID:', session.user.id);
      console.log('📅 Timestamp:', new Date().toISOString());
      console.log('📞 Calling create-subscription API...');
      
      // Create subscription link via API
      const response = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API Response status:', response.status, response.statusText);
      const result = await response.json();
      console.log('📋 API Response received');

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create subscription link');
      }

      // Store subscription ID and status for later verification
      if (result.subscription_id) {
        localStorage.setItem('pending_subscription_id', result.subscription_id);
        localStorage.setItem('subscription_status', result.status || 'created');
        console.log('✅ Subscription created with status:', result.status);
        console.log('📊 Status info:', result.status_info);
      }

      // Log the short_url for debugging
      console.log('🔗 Short URL received from API:', result.short_url);
      console.log('📋 Full subscription response:', {
        subscription_id: result.subscription_id,
        status: result.status,
        short_url: result.short_url,
        plan_id: result.plan_id,
        success_redirect_url: result.success_redirect_url,
      });

      // Store subscription info for polling and show payment modal
      if (result.subscription_id && result.short_url) {
        setCurrentSubscriptionId(result.subscription_id);
        setCurrentSubscriptionStatus(result.status || 'created');
        setPaymentUrl(result.short_url);
        setPollingAttempts(0);

        // Show payment processing modal
        console.log('📱 Showing payment processing modal');
        setShowPaymentProcessingModal(true);
        setProcessingPro(false); // Reset button state

        // Open Razorpay payment page in NEW TAB
        console.log('🚀 Opening Razorpay payment page in new tab:', result.short_url);
        
        try {
          const paymentWindow = window.open(result.short_url, '_blank', 'noopener,noreferrer');
          
          if (!paymentWindow || paymentWindow.closed || typeof paymentWindow.closed === 'undefined') {
            // Popup blocked - this is normal browser behavior, not an error
            console.log('ℹ️ Popup blocked by browser - user can click link in modal instead');
            // Don't show error modal, just keep payment modal open with link
            // Start polling anyway - user might click the link and complete payment
            console.log('🔄 Starting subscription status polling (user will click link manually)...');
            pollSubscriptionStatus(result.subscription_id, session.access_token);
          } else {
            console.log('✅ Payment window opened successfully');
            
            // Start polling subscription status
            console.log('🔄 Starting subscription status polling...');
            pollSubscriptionStatus(result.subscription_id, session.access_token);
          }
        } catch (error) {
          // Fallback if window.open fails
          console.log('ℹ️ Could not open popup - user can click link in modal instead');
          // Start polling anyway
          pollSubscriptionStatus(result.subscription_id, session.access_token);
        }
      } else {
        console.error('❌ Short URL not received from server');
        throw new Error('Subscription link not received from server');
      }
    } catch (error: any) {
      console.error('❌ Error in handleProPlan:', error);
      
      // Stop polling if it was started
      stopPolling();
      
      // Reset states
      setProcessingPro(false);
      setShowPaymentProcessingModal(false);
      setCurrentSubscriptionId(null);
      setPaymentUrl(null);
      setPollingAttempts(0);
      
      // Show error
      setErrorMessage(`Error: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // One-shot payment for Pro Plan 1 Month (₹499) — Order → Razorpay Checkout → Verify → Grant Pro 1 month + credits
  const handleProPlanOneMonth = async () => {
    if (!user) {
      router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
      return;
    }

    setProcessingProOneMonth(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError?.message?.includes('Refresh Token') || sessionError?.message?.includes('JWT')) {
        await supabase.auth.signOut();
        router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
        return;
      }
      if (sessionError || !session) {
        router.push(`/signin?returnTo=${encodeURIComponent('/pricing')}`);
        return;
      }

      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_type: 'pro_one_month' }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || orderData.error || 'Failed to create order');
      }

      const { order_id, razorpay_key_id, purchase_id } = orderData;
      if (!order_id || !razorpay_key_id) {
        throw new Error('Invalid response from server');
      }

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: razorpay_key_id,
        order_id,
        name: 'BrokeNoMore',
        description: 'Monthly Plan - ₹499',
        prefill: { email: user.email ?? undefined },
        modal: {
          ondismiss: () => setProcessingProOneMonth(false),
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                purchase_id: purchase_id ?? undefined,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || verifyData.message || 'Payment verification failed');
            }

            await loadCreditsData(session.access_token);
            await loadSubscription(session.access_token);
            setProcessingProOneMonth(false);
            setSuccessMessage(`Payment successful! Your Pro Plan (1 month) is active. You received ${verifyData.credits_added ?? 1500} credits.`);
            setShowSuccessModal(true);
            setTimeout(() => router.push('/dashboard'), 3000);
          } catch (err: any) {
            setProcessingProOneMonth(false);
            setErrorMessage(err.message || 'Payment verification failed');
            setShowErrorModal(true);
          }
        },
      });

      rzp.open();
    } catch (error: any) {
      setProcessingProOneMonth(false);
      setErrorMessage(error?.message || 'Something went wrong');
      setShowErrorModal(true);
    }
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

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: heroGradient }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-purple-100 mb-8">
            Select the perfect plan for your needs. All plans include credits for transactions.
          </p>
          {user && creditsData && (
            <div className="mt-8 inline-block bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <p className="text-white text-lg">
                Current Balance: <span className="font-bold">{creditsData.balance || 0} credits</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h3>
                <p className="text-gray-600 mb-6">New users trying the app — zero risk, curiosity</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">₹0</span>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-[#6B46C1] mb-1">
                    5 Credits
                  </div>
                  <div className="text-sm text-gray-600">One-time</div>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Access to Offers & Deals only</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">5 credits one-time, no card required</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Zero risk, one-time activation</span>
                </li>
              </ul>

              <button
                onClick={handleFreePlan}
                disabled={claimingFree || (creditsData?.free_plan_claimed)}
                className={`w-full text-center py-3 rounded-lg font-semibold transition ${
                  creditsData?.free_plan_claimed
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#6B46C1] text-white hover:bg-[#553C9A]'
                }`}
              >
                {claimingFree
                  ? 'Activating...'
                  : creditsData?.free_plan_claimed
                  ? 'Already Activated'
                  : 'Activate Free Plan'}
              </button>
            </div>

            {/* Monthly / Yearly Plan - Middle (Recommended) */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#6B46C1] p-8 scale-105 md:scale-110 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#6B46C1] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  ⭐ Recommended
                </span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly / Yearly Plan</h3>
                <p className="text-gray-600 mb-6">Long-term users who want maximum value — best price, savings, bonus credits</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">₹399</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Billed yearly</p>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-[#6B46C1] mb-1">
                    500 Credits
                  </div>
                  <div className="text-sm text-gray-600">Per billing cycle</div>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Broke AI</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">AI Fundamental Analysis</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Mutual Fund Research</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Free Offers</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Secure payment via Razorpay</span>
                </li>
              </ul>

              {/* Subscription Status Indicator */}
              {isProSubscribed && subscription?.ends_at && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Active until {new Date(subscription.ends_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleProPlan}
                disabled={processingPro || isProSubscribed}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  isProSubscribed
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : processingPro
                    ? 'bg-[#6B46C1] text-white opacity-50 cursor-not-allowed'
                    : 'bg-[#6B46C1] text-white hover:bg-[#553C9A]'
                }`}
              >
                {processingPro
                  ? 'Processing...'
                  : isProSubscribed
                  ? 'Already Purchased'
                  : 'Buy Yearly Plan'}
              </button>
            </div>

            {/* Monthly Plan (₹499) */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                <p className="text-gray-600 mb-6">Users who want flexibility at lower cost — discount advantage</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">₹499</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-[#6B46C1] mb-1">
                    400 Credits
                  </div>
                  <div className="text-sm text-gray-600">Per month</div>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Broke AI</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">AI Fundamental Analysis</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Mutual Fund Research</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Free Offers</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">Secure payment via Razorpay</span>
                </li>
              </ul>

              {isProSubscribed && subscription?.ends_at && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Active until {new Date(subscription.ends_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleProPlanOneMonth}
                disabled={processingProOneMonth || isProSubscribed}
                className={`w-full text-center py-3 rounded-lg font-semibold transition ${
                  isProSubscribed
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : processingProOneMonth
                    ? 'bg-[#6B46C1] text-white opacity-50 cursor-not-allowed'
                    : 'bg-[#6B46C1] text-white hover:bg-[#553C9A]'
                }`}
              >
                {processingProOneMonth
                  ? 'Processing...'
                  : isProSubscribed
                  ? 'Already Purchased'
                  : 'Buy Monthly Plan'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                question: "What are credits?",
                answer:
                  "Credits are used for transactions and operations within BrokeNoMore. Each transaction consumes a certain number of credits based on the operation type.",
              },
              {
                question: "Can I claim the Free Plan multiple times?",
                answer:
                  "No, the Free Plan can only be claimed once per account. After claiming, you'll receive 5 lifetime credits.",
              },
              {
                question: "What happens when my Pro Plan expires?",
                answer:
                  "When your Pro Plan subscription expires after 30 days, you'll need to purchase a new subscription to continue receiving daily credits. Any unused credits remain in your account.",
              },
              {
                question: "How do I check my credit balance?",
                answer:
                  "You can view your current credit balance and transaction history in the Dashboard after logging in.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <p>&copy; 2024 BrokeNoMore. All rights reserved.</p>
        </div>
      </footer>

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => {
            setShowSuccessModal(false);
            if (successMessage.includes('Payment successful')) {
              router.push('/dashboard');
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              {/* Success Icon */}
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
              
              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (successMessage.includes('Payment successful')) {
                    router.push('/dashboard');
                  }
                }}
                className="w-full bg-[#6B46C1] text-white py-3 rounded-lg font-semibold hover:bg-[#553C9A] transition"
              >
                {successMessage.includes('Payment successful') ? 'Go to Dashboard' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentProcessingModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Don't close on background click - user needs to complete payment
            e.stopPropagation();
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              {/* Processing Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1]"></div>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h3>
              
              {/* Status Message */}
              <p className="text-gray-600 mb-4">
                {currentSubscriptionStatus === 'created' 
                  ? 'Waiting for payment confirmation...'
                  : currentSubscriptionStatus === 'authenticated' 
                  ? 'Payment successful! Activating subscription...'
                  : currentSubscriptionStatus === 'active'
                  ? 'Subscription activated! Updating your account...'
                  : 'Processing your subscription...'}
              </p>

              {/* Progress Indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-[#6B46C1] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((pollingAttempts / 30) * 100, 100)}%` }}
                ></div>
              </div>

              {/* Status Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold capitalize">{currentSubscriptionStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Polling attempts:</span>
                    <span className="font-semibold">{pollingAttempts}/30</span>
                  </div>
                </div>
              </div>

              {/* Payment Link */}
              {paymentUrl && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Complete payment in the new tab, or click below:</p>
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[#6B46C1] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#553C9A] transition"
                  >
                    Open Payment Page
                  </a>
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-gray-500 mt-4">
                <p>Please complete the payment in the new tab.</p>
                <p>This page will automatically detect when payment is completed.</p>
              </div>

              {/* Close button (only show if payment is taking too long) */}
              {pollingAttempts > 20 && (
                <button
                  onClick={handleClosePaymentModal}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Close (Check dashboard later)
                </button>
              )}

              {/* Cancel button (always available) */}
              <button
                onClick={handleClosePaymentModal}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setShowErrorModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              {/* Error Icon */}
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
              
              {/* Error Message */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              
              {/* Close Button */}
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

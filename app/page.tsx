"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { FAQSection } from "@/components/ui/faq-section";
import { MagicBento } from "@/components/ui/magic-bento";
import Antigravity from "@/components/ui/antigravity";
import { supabase } from "../lib/supabase";

export default function Home() {
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTabletOrAbove, setIsTabletOrAbove] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    checkSubscription();
  }, []);

  // Load TradingView ticker tape module script
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsTabletOrAbove(window.innerWidth >= 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    const handleMouseMove = (e: MouseEvent) => {
      // Only enable animation on tablet and above (640px+)
      if (window.innerWidth >= 640) {
        const rect = document.querySelector('.hero-section-container')?.getBoundingClientRect();
        if (rect) {
          // Increased multiplier from 30 to 50 for more responsive movement
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 50;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 50;
          setMousePosition({ x, y });
        }
      } else {
        // Reset position on mobile
        setMousePosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove as EventListener);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Background Antigravity Effect */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        style={{
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          opacity: 0.6
        }}>
          <Antigravity
            count={300}
            magnetRadius={8}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={3}
            lerpSpeed={0.05}
            color={'#A855F7'}
            autoAnimate={true}
            particleVariance={1}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header and Hero Section - Merged Background */}
        <div style={{ background: heroGradient }}>
          <Navbar />

          {/* TradingView Ticker Tape */}
          <div className="w-full">
            {React.createElement('tv-ticker-tape', {
              symbols: 'FOREXCOM:SPXUSD,FOREXCOM:NSXUSD,FOREXCOM:DJI,FX:EURUSD,BITSTAMP:BTCUSD,BITSTAMP:ETHUSD',
              'show-hover': true,
              theme: 'dark',
              transparent: true
            })}
          </div>

          {/* Hero Section */}
          <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              {/* Main Headline */}
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                  Managing payments has been <br className="hidden sm:inline" /> never easier.
                </h1>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.bnm.broke_no_more"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-full hover:bg-white hover:text-[#2b1b55] transition font-medium flex items-center justify-center gap-2 min-w-[200px] sm:min-w-[220px]"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4486.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4486.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9971-3.4592a.416.416 0 00-.1521-.5674.416.416 0 00-.5674.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1349 1.2297L4.8429 5.5773a.4161.4161 0 00-.5674-.1521.416.416 0 00-.1521.5674l1.9971 3.4592C2.6889 11.186.8532 13.0817.8532 15.7404v.9165c0 .2768.2237.5005.5005.5005h21.2931c.2768 0 .5005-.2237.5005-.5005v-.9165c0-2.6587-1.8357-4.5537-4.1707-5.4189" />
                    </svg>
                    <span className="text-sm sm:text-base">Download Android</span>
                  </a>
                  <a
                    href="https://apps.apple.com/in/app/brokenomore/id6756296299"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:border-2 hover:border-white hover:bg-transparent hover:text-white px-6 sm:px-8 py-3 rounded-full bg-white text-[#2b1b55] transition font-medium flex items-center justify-center gap-2 min-w-[200px] sm:min-w-[220px]"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="text-sm sm:text-base">Download iOS</span>
                  </a>
                </div>
              </div>

              {/* Central Illustration Area - Using home_page.png with overlapping cards */}
              <div className="hero-section-container relative mt-8 sm:mt-16 flex flex-col items-center justify-center min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]">
                <div className="relative w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl mx-auto px-4">
                  {/* Base home_page.png image */}
                  <div className="relative w-full flex justify-center bg-transparent">
                    <Image
                      src="/assets/images/home_page.png"
                      alt="BrokeNoMore Payment Management"
                      width={1200}
                      height={800}
                      className="w-full h-auto max-h-[500px] sm:max-h-[600px] lg:max-h-[700px] object-contain relative z-10"
                      style={{
                        background: 'transparent',
                        mixBlendMode: 'normal'
                      }}
                      unoptimized
                      priority
                    />
                  </div>

                  {/* Cashback Card - Top Left Overlapping the phone */}
                  <div
                    className="absolute top-[5%] sm:top-[12%] md:top-[14%] left-[2%] sm:left-[18%] md:left-[20%] lg:left-[27%] z-20 w-32 sm:w-44 md:w-52 lg:w-60 xl:w-68 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * 0.8}px, ${mousePosition.y * 0.8}px)` : 'none' }}
                  >
                    <Image
                      src="/assets/images/tip.png"
                      alt="Tip"
                      width={170}
                      height={200}
                      className="drop-shadow-2xl rounded-[20px]"
                      priority
                    />
                  </div>

                  {/* Annual Increase Card - Top Right Overlapping the phone */}
                  <div
                    className="absolute top-[20%] sm:top-[12%] md:top-[21%] right-[2%] sm:right-[18%] md:right-[20%] lg:right-[22%] z-20 w-32 sm:w-44 md:w-52 lg:w-60 xl:w-68 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * -0.9}px, ${mousePosition.y * 0.9}px)` : 'none' }}
                  >
                    <Image
                      src="/assets/images/today_section.png"
                      alt="Today Section"
                      width={300}
                      height={300}
                      className="drop-shadow-2xl rounded-[20px]"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* Credit Card - Bottom Left Overlapping the phone */}
                  <div
                    className="absolute bottom-[15%] sm:bottom-[22%] md:bottom-[24%] lg:bottom-[7%] left-[5%] sm:left-[20%] md:left-[22%] lg:left-[24%] z-20 w-44 sm:w-48 md:w-56 lg:w-64 xl:w-72 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * 0.7}px, ${mousePosition.y * -0.7}px)` : 'none' }}
                  >
                    <Image
                      src="/assets/images/card.png"
                      alt="BrokeNoMore Credit Card"
                      width={500}
                      height={400}
                      className="w-full h-auto drop-shadow-2xl"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* Floating Icons - Randomly positioned (Hidden on mobile) */}
                  {/* Lock Icon - Top Left */}
                  <div
                    className="hidden sm:flex absolute top-[5%] left-[5%] sm:left-[8%] z-15 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full items-center justify-center shadow-lg opacity-90 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` : 'none' }}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#6B46C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>

                  {/* Checkmark Icon - Mid Left */}
                  <div
                    className="hidden sm:flex absolute top-[35%] sm:top-[40%] left-[3%] sm:left-[5%] z-15 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg items-center justify-center shadow-lg opacity-90 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * 0.6}px, ${mousePosition.y * 0.6}px)` : 'none' }}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  {/* Dollar Sign Icon - Top Right */}
                  <div
                    className="hidden sm:flex absolute top-[8%] right-[5%] sm:right-[8%] z-15 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg items-center justify-center shadow-lg opacity-90 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * 0.5}px)` : 'none' }}
                  >
                    <span className="text-2xl sm:text-3xl font-bold text-yellow-500">₹</span>
                  </div>

                  {/* Percentage Icon - Mid Right */}
                  <div
                    className="hidden sm:flex absolute top-[45%] sm:top-[50%] right-[4%] sm:right-[6%] z-15 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full items-center justify-center shadow-lg opacity-90 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * -0.6}px, ${mousePosition.y * 0.6}px)` : 'none' }}
                  >
                    <span className="text-xl sm:text-2xl font-bold text-[#6B46C1]">%</span>
                  </div>

                  {/* Shield Icon - Bottom Right */}
                  <div
                    className="hidden sm:flex absolute bottom-[15%] sm:bottom-[20%] right-[8%] sm:right-[10%] z-15 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg items-center justify-center shadow-lg opacity-90 sm:transition-transform sm:duration-300 sm:ease-out"
                    style={{ transform: isTabletOrAbove ? `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * -0.5}px)` : 'none' }}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#6B46C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Pricing Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
              Choose Your Plan
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Select the perfect plan for your needs. All plans include credits for transactions.
            </p>
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

                <Link
                  href="/pricing"
                  className="block w-full text-center py-3 rounded-lg font-semibold transition bg-[#6B46C1] text-white hover:bg-[#553C9A]"
                >
                  Activate Free Plan
                </Link>
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

                {subscription?.plan === 'pro' ? (
                  <button
                    disabled
                    className="block w-full text-center bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Already Purchased
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="block w-full text-center bg-[#6B46C1] text-white py-3 rounded-lg font-semibold hover:bg-[#553C9A] transition"
                  >
                    Buy Yearly Plan
                  </Link>
                )}
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

                <Link
                  href="/pricing"
                  className="block w-full text-center py-3 rounded-lg font-semibold transition bg-[#6B46C1] text-white hover:bg-[#553C9A]"
                >
                  Buy Monthly Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Video & Social Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
              Know More About It
            </h2>
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              {/* Left Column - Video */}
              <div className="w-full lg:w-2/3">
                <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl aspect-video">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/SUSxVzWrFUk?si=94z6dOVuyuxso1mK"
                    title="BrokeNoMore Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>

              {/* Right Column - Social Links */}
              <div className="w-full lg:w-1/3 flex flex-col items-start gap-4">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 px-2">Connect With Us</h3>
                
                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/brokenomore.in?igsh=Zm13NWp5bzd3MjZm&utm_source=qr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-gray-700 hover:text-[#E4405F] transition group w-full p-4 rounded-xl hover:bg-white hover:shadow-xl"
                >
                  <div className="w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-pink-50 transition">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-lg font-bold group-hover:text-[#E4405F]">Instagram</span>
                    <span className="text-sm font-medium">brokenomore.in</span>
                  </div>
                </a>

                {/* LinkedIn */}
                <a 
                  href="https://www.linkedin.com/company/broke-no-more/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-gray-700 hover:text-[#0A66C2] transition group w-full p-4 rounded-xl hover:bg-white hover:shadow-xl"
                >
                  <div className="w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-50 transition">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-lg font-bold group-hover:text-[#0A66C2]">LinkedIn</span>
                    <span className="text-sm font-medium">Broke No More</span>
                  </div>
                </a>

                {/* YouTube */}
                <a 
                  href="https://youtube.com/@brokenomore17?si=1N15xX8Ltb3e3uJ_" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-gray-700 hover:text-[#FF0000] transition group w-full p-4 rounded-xl hover:bg-white hover:shadow-xl"
                >
                  <div className="w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-full bg-gray-100 group-hover:bg-red-50 transition">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-lg font-bold group-hover:text-[#FF0000]">YouTube</span>
                    <span className="text-sm font-medium">@brokenomore17</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* How BrokeNoMore Works */}
        {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-900">
            How BrokeNoMore Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Download & Register the App",
                description:
                  "Download BrokeNoMore from the App Store or Play Store and create your account using email or mobile verification. Your journey toward smarter money management starts here.",
              },
              {
                number: "02",
                title: "Set Up Your Financial Profile",
                description:
                  "Enter basic details like income, expenses, goals, and preferences. This helps BrokeNoMore personalize budgets, insights, and AI-powered recommendations just for you.",
              },
              {
                number: "03",
                title: "Start Managing Money Smarter",
                description:
                  "Get instant access to your digital dashboard—track expenses, set goals, analyze spending, and unlock smart insights to stay in control of your finances.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-purple-200 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}


        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
              Why choose BrokeNoMore?
            </h2>

            <StickyScroll
              content={[
                {
                  title: "Easy, Secure & Smart Digital Payments",
                  description:
                    "Enroll seamlessly using India's safest and most trusted payment gateway – Razorpay. Your transactions are encrypted, fast, and 100% secure.",
                  content: (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,#e0e7ff,#ddd6fe)] text-black text-xl font-semibold px-4 text-center">
                      Easy, Secure & Smart Digital Payments
                    </div>
                  ),
                },
                {
                  title: "Subscription Management Dashboard",
                  description:
                    "Get access to a powerful dashboard where you can: Manage and upgrade your subscription anytime, view your current plan and validity, update or renew your subscription effortlessly. Everything stays under your control, in one place.",
                  content: (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,#dbeafe,#e0f2fe)] text-black text-xl font-semibold px-4 text-center">
                      Subscription Management Dashboard
                    </div>
                  ),
                },
                {
                  title: "Track Your Credit Usage Transparently",
                  description:
                    "Stay informed with real-time credit tracking: See exactly where and how your credits are spent, monitor AI feature usage and premium services, avoid surprises with complete spending transparency.",
                  content: (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,#fce7f3,#fdf2f8)] text-black text-xl font-semibold px-4 text-center">
                      Track Your Credit Usage Transparently
                    </div>
                  ),
                },
                {
                  title: "Free & Hassle-Free Enrollment",
                  description:
                    "No hidden charges. Instant activation after payment. Cancel or upgrade anytime.",
                  content: (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,#ecfccb,#f0fdf4)] text-black text-xl font-semibold px-4 text-center">
                      Free & Hassle-Free Enrollment
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </section>

        {/* Why BrokeNoMore is Right Choice */}
        {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-900">
            Why BrokeNoMore is the Right Choice for You
          </h2>

          <MagicBento 
            cards={[
              {
                color: '#ffffff',
                title: "All-in-One Smart Money Management",
                description: "BrokeNoMore brings budgeting, expense tracking, goal planning, and insights into a single platform—eliminating the need for multiple finance apps and spreadsheets.",
                label: "Smart Finance"
              },
              {
                color: '#ffffff',
                title: "AI-Powered Financial Intelligence",
                description: "The app doesn't just track money—it analyzes your spending behavior, identifies patterns, and provides actionable recommendations to help you save more and spend smarter.",
                label: "AI Insights"
              },
              {
                color: '#ffffff',
                title: "Personalized for Every User",
                description: "BrokeNoMore adapts to individual income levels, lifestyles, and goals—making it suitable for students, working professionals, and families alike.",
                label: "Personalized"
              },
              {
                color: '#ffffff',
                title: "Simple, Secure & User-Friendly",
                description: "With an intuitive interface and secure authentication, BrokeNoMore ensures that financial management stays easy, private, and stress-free for all users.",
                label: "Secure"
              },
              {
                color: '#ffffff',
                title: "Built for Long-Term Financial Growth",
                description: "Beyond daily expense tracking, BrokeNoMore focuses on financial discipline, awareness, and long-term stability, helping users break the paycheck-to-paycheck cycle.",
                label: "Growth"
              },
            ]}
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={300}
            particleCount={12}
            glowColor="132, 0, 255"
          />
        </div>
      </section> */}

        {/* Meet the Founders */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Column - Text Content */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Meet the Founders
                </h2>
                <div className="w-16 h-1 bg-gray-300 mb-8"></div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <p className="text-gray-600 leading-relaxed">
                    BrokeNoMore was founded by passionate entrepreneurs dedicated to revolutionizing personal finance management. Our founders bring together expertise in technology, finance, and user experience to create a platform that empowers individuals to take control of their financial future.
                  </p>
                </div>
              </div>

              {/* Right Column - Founder Profiles */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center sm:items-start items-center">
                {/* Founder 1 - Kushagra Gandhi */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-2 border-gray-200">
                    <Image
                      src="/assets/images/kushagra_prof.jpg"
                      alt="Kushagra Gandhi"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 uppercase mb-1">
                    Kushagra Gandhi
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Co-Founder</p>
                  <div className="flex gap-4 justify-center">
                    <a
                      href="https://www.instagram.com/kushagragandhi?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-[#6B46C1] transition"
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/kushagra-gandhi-841274259?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-[#6B46C1] transition"
                      aria-label="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Founder 2 - Vruddhi Madhani */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-2 border-gray-200">
                    <Image
                      src="/assets/images/vruddhi_prof1.jpg"
                      alt="Vruddhi Madhani"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 uppercase mb-1">
                    Vruddhi Madhani
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Co-Founder</p>
                  <div className="flex gap-4 justify-center">
                    <a
                      href="https://www.instagram.com/_vruddhi_99?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-[#6B46C1] transition"
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/vruddhi-madhani-116815299?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-[#6B46C1] transition"
                      aria-label="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <InfiniteMovingCards
            items={[
              {
                quote:
                  "Love the simplicity of the service. A digital wallet platform that provides complete financial solutions to meet your entire financial tasks.",
                name: "Carolyn Ortiz",
                title: "Customer",
              },
              {
                quote:
                  "Demesne's new manners savings staying had. Under folly balls, death own point now men. Match way these she avoids seeing death.",
                name: "Larry Lawson",
                title: "Customer",
              },
              {
                quote:
                  "Offered chiefly farther of my no colonel shyness. Such on help ye some door if in. Laughter proposal laughing any son law consider.",
                name: "Frances Guerrero",
                title: "Customer",
              },
              {
                quote:
                  "All led out world this music while asked. Paid mind even sons does he door no. Attended overcame repeated it is perceived Marianne in.",
                name: "Dennis Barrett",
                title: "Customer",
              },
            ]}
            direction="right"
            speed="slow"
            pauseOnHover={false}
            className="mx-auto"
          />
        </div>
      </section> */}

        {/* Contact Form Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600">
                Have a question or need help? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
              {submitStatus.type && (
                <div
                  className={`mb-6 p-4 rounded-lg ${submitStatus.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                  <p className="font-medium">{submitStatus.message}</p>
                </div>
              )}

              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  setSubmitStatus({ type: null, message: '' });

                  try {
                    const response = await fetch('/api/contact', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message,
                      }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      setSubmitStatus({
                        type: 'success',
                        message: 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.',
                      });
                      // Reset form
                      setFormData({
                        name: '',
                        email: '',
                        subject: '',
                        message: '',
                        consent: false,
                      });
                    } else {
                      setSubmitStatus({
                        type: 'error',
                        message: data.error || 'Failed to send message. Please try again.',
                      });
                    }
                  } catch (error) {
                    setSubmitStatus({
                      type: 'error',
                      message: 'An error occurred. Please try again later.',
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent text-black outline-none transition"
                    placeholder="What is this regarding?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    required
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="w-4 h-4 text-[#6B46C1] border-gray-300 rounded focus:ring-[#6B46C1]"
                  />
                  <label htmlFor="consent" className="ml-2 text-sm text-gray-600">
                    I agree to the <Link href="/privacy" className="text-[#6B46C1] hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-[#6B46C1] hover:underline">Terms of Service</Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#6B46C1] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#553C9A] transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center sm:text-left">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                    <a href="mailto:support@brokenomore.in" className="text-[#6B46C1] hover:underline">
                      support@brokenomore.in
                    </a>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                    <p className="text-gray-600">We typically respond within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner with Us & Sponsorships */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Partner with Us
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#6B46C1] mb-6">
              Sponsorships
            </h3>
            <p className="text-lg text-gray-600 mb-10">
              Collaborate with BrokeNoMore to promote your brand directly to India&apos;s most connected audience focused on smart money management.
            </p>
            <div className="group relative">
              {/* Top card - sits on top, overlaps the card below */}
              <div className="relative z-10 rounded-2xl border-2 border-[#6B46C1] bg-white shadow-lg p-8 sm:p-10 text-center -mb-4">
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                  Want to get sponsored by BrokeNoMore? We&apos;re excited to support creators and communities! Apply now by emailing us at{" "}
                  <a
                    href="mailto:admin@brokenomore.in"
                    className="font-bold text-[#6B46C1] underline decoration-[#6B46C1]/60 underline-offset-2 hover:text-[#553C9A] hover:decoration-[#553C9A]"
                  >
                    admin@brokenomore.in
                  </a>
                  {" "}— let&apos;s make something awesome together!
                </p>
              </div>

              {/* Second card - hidden under the top card, slides down on hover */}
              <div className="relative z-0 h-18 mt-2 overflow-hidden w-auto">
                <div className="rounded-b-xl border-2 border-[#6B46C1] bg-[#6B46C1] text-white text-sm font-medium py-2 px-4 shadow-lg w-auto h-18 flex items-center justify-center text-center leading-snug translate-y-[-80%] group-hover:translate-y-0 transition-transform duration-300 ease-out [color:white]">
                  <p><strong>Contact us: </strong>     get sponsored or affiliated with BrokeNoMore</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <FAQSection
          categories={[
            {
              id: "general",
              name: "General",
              items: [
                {
                  id: "gen-1",
                  question: "What is BrokeNoMore?",
                  answer:
                    "BrokeNoMore is a smart personal finance app that helps you track expenses, manage budgets, set financial goals, and make informed money decisions using intelligent insights.",
                },
                {
                  id: "gen-2",
                  question: "Is BrokeNoMore free to use?",
                  answer:
                    "Yes. BrokeNoMore offers a free plan with essential budgeting features. You can upgrade to Pro for advanced tools and AI-powered features.",
                },
                {
                  id: "gen-3",
                  question: "Is BrokeNoMore available on mobile and web?",
                  answer:
                    "Yes. The BrokeNoMore app is available for iOS and Android mobiles. You can also manage your account through the website.",
                },
              ],
            },
            {
              id: "registration",
              name: "Registration & Account",
              items: [
                {
                  id: "reg-1",
                  question: "How do I create an account?",
                  answer:
                    "You can register using your email or mobile number directly from the app or website. The onboarding process is quick and simple.",
                },
                {
                  id: "reg-2",
                  question: "Can I use the same account on multiple devices?",
                  answer:
                    "Yes. You can log in on multiple devices using the same account, and your data will stay synced securely.",
                },
                {
                  id: "reg-3",
                  question: "What happens if I change my phone?",
                  answer:
                    "Just log in with your registered credentials on the new device. Your data and subscription will be restored automatically.",
                },
              ],
            },
            {
              id: "subscription",
              name: "Subscription & Payments",
              items: [
                {
                  id: "sub-1",
                  question: "What subscription plans are available?",
                  answer:
                    "BrokeNoMore offers: Free Plan – Core budgeting features. Pro Plan – Advanced insights, AI features, and higher usage limits.",
                },
                {
                  id: "sub-2",
                  question: "How do I subscribe to the Pro plan?",
                  answer:
                    "You can enroll using our safe and secure payment gateway (Razorpay) through our website. Once payment is successful, your Pro benefits are activated instantly.",
                },
                {
                  id: "sub-3",
                  question: "Is Razorpay safe for payments?",
                  answer:
                    "Yes. Razorpay is a trusted and industry-standard payment provider that ensures secure and encrypted transactions.",
                },
              ],
            },
            {
              id: "dashboard",
              name: "Dashboard & Credits",
              items: [
                {
                  id: "dash-1",
                  question: "What is the dashboard used for?",
                  answer:
                    "The dashboard allows you to: Manage your subscription, view and update your profile, monitor your spending insights, and track credit usage in real time.",
                },
                {
                  id: "dash-2",
                  question: "What are credits in BrokeNoMore?",
                  answer:
                    "Credits are used for AI-powered features such as advanced analysis, recommendations, and smart financial insights.",
                },
                {
                  id: "dash-3",
                  question: "How can I track my credit usage?",
                  answer:
                    "You can view a detailed credit usage breakdown in the dashboard, showing exactly where and how your credits are spent.",
                },
                {
                  id: "dash-4",
                  question: "What happens if my credits are exhausted?",
                  answer:
                    "Once your credits are used up, AI features will be limited until credits are renewed or you upgrade your plan.",
                },
              ],
            },
            {
              id: "security",
              name: "Security & Privacy",
              items: [
                {
                  id: "sec-1",
                  question: "Is my financial data safe?",
                  answer:
                    "Absolutely. BrokeNoMore uses industry-grade security practices to protect your data. Your information is never shared without your consent.",
                },
                {
                  id: "sec-2",
                  question: "Does BrokeNoMore store my bank or card details?",
                  answer:
                    "No. All payments are handled securely by Razorpay. BrokeNoMore does not store your card or banking details.",
                },
              ],
            },
            {
              id: "features",
              name: "Features & Usage",
              items: [
                {
                  id: "feat-1",
                  question: "Can I track expenses manually?",
                  answer:
                    "Yes. You can easily add, edit, and categorize expenses manually within the app.",
                },
                {
                  id: "feat-2",
                  question: "Does BrokeNoMore provide financial advice?",
                  answer:
                    "BrokeNoMore provides data-driven insights and suggestions to help you make better financial decisions. It does not replace professional financial advice.",
                },
              ],
            },
            {
              id: "support",
              name: "Support",
              items: [
                {
                  id: "sup-1",
                  question: "How can I contact support?",
                  answer:
                    "You can reach us via the Help & Support section in the app or through the contact page on our website.",
                },
                {
                  id: "sup-2",
                  question: "What should I do if I face payment or subscription issues?",
                  answer:
                    "If you experience any issues related to payments, subscriptions, or credits, contact our support team and we'll assist you promptly.",
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
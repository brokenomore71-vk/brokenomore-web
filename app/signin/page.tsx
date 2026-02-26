"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "../../lib/supabase";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
      setError("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.");
      return;
    }

    setLoading(true);
    setError("");

    // Check if these are admin credentials
    const isAdminCredentials = email.toLowerCase() === 'admin@brokenomore.in' && password === 'BrokeNoMore@25';

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If login failed and it's admin credentials, try to create the admin user
      if (signInError && isAdminCredentials) {
        // Check if error is due to user not existing
        if (signInError.message.includes('Invalid login credentials') || 
            signInError.message.includes('Email not confirmed') ||
            signInError.message.includes('Invalid login')) {
          
          // Try to sign up the admin user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'admin@brokenomore.in',
            password: 'BrokeNoMore@25',
            options: {
              emailRedirectTo: `${window.location.origin}/admin`
            }
          });

          if (signUpError) {
            // If sign up fails, check if it's because user already exists but needs confirmation
            if (signUpError.message.includes('already registered') || 
                signUpError.message.includes('already been registered')) {
              setError('Admin account exists but email may not be confirmed. Please check your email for confirmation link, or if email confirmation is disabled in Supabase, try logging in again.');
            } else {
              throw new Error(`Failed to create admin user: ${signUpError.message}`);
            }
            return;
          }

          // If user was created but email confirmation is required
          if (signUpData.user && !signUpData.session) {
            setError('Admin account created! Please check your email to confirm your account, then try logging in again. If email confirmation is disabled in Supabase settings, try logging in again in a moment.');
            return;
          }

          // If we got a session immediately, sign in was successful
          if (signUpData.session) {
            router.push('/admin');
            router.refresh();
            return;
          }

          // Otherwise, try signing in again after a brief moment
          setTimeout(async () => {
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: 'admin@brokenomore.in',
              password: 'BrokeNoMore@25',
            });

            if (retryError) {
              if (retryError.message.includes('Email not confirmed')) {
                setError('Admin account created! Please check your email to confirm your account, then try logging in again.');
              } else {
                setError(`Admin account may have been created. Error: ${retryError.message}. Please try again in a moment.`);
              }
            } else if (retryData?.user) {
              router.push('/admin');
              router.refresh();
            }
          }, 1000);
          return;
        } else {
          // Other error, throw it
          throw signInError;
        }
      }

      if (signInError) throw signInError;

      if (data.user) {
        // Check if user is admin
        const isAdmin = data.user.email?.toLowerCase() === 'admin@brokenomore.in';
        
        if (isAdmin) {
          // Redirect admin to admin panel
          router.push('/admin');
          router.refresh();
        } else {
          // Redirect regular users based on returnTo query param or default to pricing
          const searchParams = new URLSearchParams(window.location.search);
          const returnTo = searchParams.get('returnTo') || '/pricing';
          router.push(returnTo);
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div style={{ background: heroGradient }}>
        <Navbar />
        <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4 py-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center p-1 bg-white">
                <Image
                  src="/assets/images/main_logo.png"
                  alt="BrokeNoMore"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-white text-2xl font-bold">BrokeNoMore</span>
            </Link>
          </div>

          {/* Sign In Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-600 mb-8">Welcome back! Please sign in to your account.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 text-[#6B46C1] border-gray-300 rounded focus:ring-[#6B46C1]"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                    Remember me
                  </label>
                </div>
                <Link href="#" className="text-sm text-[#6B46C1] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B46C1] text-white py-3 rounded-lg font-semibold hover:bg-[#553C9A] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#6B46C1] font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

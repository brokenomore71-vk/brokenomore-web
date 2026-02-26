"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // If there's an error (e.g., invalid refresh token), clear the session
          if (error.message?.includes('Refresh Token') || error.message?.includes('JWT')) {
            console.warn('Session error detected, clearing session:', error.message);
            supabase.auth.signOut().catch(() => {
              // Ignore sign out errors
            });
            setUser(null);
          } else {
            console.error('Auth error:', error);
          }
        } else {
          setUser(session?.user ?? null);
          // Fetch user profile if user is logged in and not admin (admin doesn't have a profile)
          if (session?.user && session.user.email?.toLowerCase() !== 'admin@brokenomore.in') {
            fetchUserProfile(session.user.id);
          }
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        // Clear session on any error
        supabase.auth.signOut().catch(() => {
          // Ignore sign out errors
        });
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed successfully
        setUser(session?.user ?? null);
        if (session?.user && session.user.email?.toLowerCase() !== 'admin@brokenomore.in') {
          fetchUserProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setAvatarError(false);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        if (session?.user && session.user.email?.toLowerCase() !== 'admin@brokenomore.in') {
          fetchUserProfile(session.user.id);
        }
      } else {
        setUser(session?.user ?? null);
        if (session?.user && session.user.email?.toLowerCase() !== 'admin@brokenomore.in') {
          fetchUserProfile(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        // Only log errors that aren't "not found" errors (PGRST116 means no rows returned)
        // This is expected for admin users who don't have a profile
        if (error.code !== 'PGRST116' && !error.message?.includes('No rows returned')) {
          console.error('Error fetching user profile:', error);
        }
        return;
      }

      if (data) {
        setUserProfile(data);
        setAvatarError(false); // Reset error when profile is fetched
      }
    } catch (error) {
      // Only log unexpected errors
      if (error instanceof Error && !error.message?.includes('No rows')) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Disable scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Re-enable scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside or on escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const mobileMenu = document.querySelector('[data-mobile-menu]');
      const menuButton = document.querySelector('[aria-label="Toggle mobile menu"]');
      
      if (isMobileMenuOpen && mobileMenu && !mobileMenu.contains(target) && !menuButton?.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  // Track scroll state for navbar spacing
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Memoize navItems to prevent hydration mismatch
  // Only include Dashboard when component is mounted and user is authenticated
  const navItems = useMemo(() => {
    const baseItems = [
      { name: "Home", link: "/" },
      { name: "Pricing", link: "/pricing" },
    ];
    
    // Only add Dashboard if component is mounted (client-side) and user is authenticated
    if (mounted && !loading && user) {
      baseItems.push({ name: "Dashboard", link: "/dashboard" });
    }
    
    baseItems.push(
      { name: "Privacy", link: "/privacy" },
      { name: "Terms", link: "/terms" },
      { name: "Delete Account", link: "/delete-account" }
    );
    
    return baseItems;
  }, [user, loading, mounted]);

  return (
    <ResizableNavbar>
      {/* Desktop Navigation */}
      <NavBody>
        <Link href="/" className={`relative z-20 flex items-center space-x-3 px-2 py-1 text-base font-semibold text-black flex-shrink-0 ${isScrolled ? 'mr-24 lg:mr-32 xl:mr-40' : 'mr-8 lg:mr-12 xl:mr-16'}`}>
          <Image
            src="/assets/images/main_logo.png"
            alt="BrokeNoMore"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-bold text-lg text-black dark:text-white">BrokeNoMore</span>
        </Link>
        <NavItems items={navItems} className={useMemo(() => {
          const rightClass = (mounted && !loading && user) ? 'right-20 lg:right-24 xl:right-32' : 'right-40 lg:right-48 xl:right-56';
          return isScrolled 
            ? `left-[30%] lg:left-[35%] xl:left-[32%] ${rightClass}` 
            : rightClass;
        }, [isScrolled, user, loading, mounted])} />
        <div className="flex items-center gap-4 flex-shrink-0">
          {loading ? (
            <div className="w-10 h-10"></div>
          ) : user ? (
            <div
              className="relative group flex-shrink-0"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <button className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition overflow-hidden">
                {userProfile?.avatar_url && !avatarError ? (
                  <img
                    src={userProfile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    onError={() => {
                      setAvatarError(true);
                    }}
                  />
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 min-w-max">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Dashboard
                  </Link>
                  <Link
                    href="/delete-account"
                    className="block px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition flex items-center gap-2"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Account
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavbarButton variant="secondary" href="/signin">Sign In</NavbarButton>
              <NavbarButton variant="primary" href="/signup">Sign Up</NavbarButton>
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <Link href="/" className="relative z-20 mr-4 flex items-center space-x-3 px-2 py-1 text-base font-semibold text-black">
            <Image
              src="/assets/images/main_logo.png"
              alt="BrokeNoMore"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="font-bold text-lg text-black dark:text-white">BrokeNoMore</span>
          </Link>
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-base font-semibold text-neutral-700 dark:text-neutral-300 block py-2"
            >
              {item.name}
            </Link>
          ))}
          {!user ? (
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="secondary"
                href="/signin"
                className="w-full"
              >
                Sign In
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                href="/signup"
                className="w-full"
              >
                Sign Up
              </NavbarButton>
            </div>
          ) : (
            <>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="px-0 py-2">
                <p className="text-sm text-gray-600 mb-2">{user.email}</p>
              </div>
              <Link
                href="/delete-account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Account
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </>
          )}
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
}

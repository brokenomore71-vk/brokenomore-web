"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          if (error.message?.includes('Refresh Token') || error.message?.includes('JWT')) {
            console.warn('Session error detected, clearing session:', error.message);
            supabase.auth.signOut().catch(() => {});
            setUser(null);
          } else {
            console.error('Auth error:', error);
          }
        } else {
          setUser(session?.user ?? null);
          if (session?.user && session.user.email?.toLowerCase() !== 'admin@brokenomore.in') {
            fetchUserProfile(session.user.id);
          }
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        if (session?.user && session.user.email?.toLowerCase() !== 'admin@brokenomore.in') {
          fetchUserProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setAvatarError(false);
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
        if (error.code !== 'PGRST116' && !error.message?.includes('No rows returned')) {
          console.error('Error fetching user profile:', error);
        }
        return;
      }

      if (data) {
        setUserProfile(data);
        setAvatarError(false);
      }
    } catch (error) {
      if (error instanceof Error && !error.message?.includes('No rows')) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on click outside or escape
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = useMemo(() => {
    const baseItems = [
      { name: "Home", link: "/" },
      { name: "Features", link: "/features" },
    ];
    
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
        {/* Brand Logo */}
        <Link
          href="/"
          className="relative z-20 flex items-center space-x-3 px-2 py-1 text-base font-semibold text-white flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          <Image
            src="/assets/images/main_logo.png"
            alt="BrokeNoMore"
            width={34}
            height={34}
            className="object-contain rounded-full"
          />
          <span className="font-bold text-lg text-white tracking-tight">BrokeNoMore</span>
        </Link>

        {/* Navigation Links - Centered & Never Disappears */}
        <NavItems items={navItems} />

        {/* Right Action / Auth Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {loading ? (
            <div className="w-9 h-9"></div>
          ) : user ? (
            <div
              className="relative group flex-shrink-0"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <button className="flex items-center justify-center w-9 h-9 bg-neutral-800 hover:bg-neutral-700 rounded-full transition overflow-hidden border border-white/10">
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
                    className="w-4 h-4 text-gray-300"
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

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 text-white rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-neutral-800">
                    <p className="text-xs text-neutral-400">Signed in as</p>
                    <p className="text-sm font-semibold text-neutral-100 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition flex items-center gap-2"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link
                    href="/delete-account"
                    className="block px-4 py-2 text-sm text-orange-400 hover:bg-neutral-800 transition flex items-center gap-2"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Account
                  </Link>
                  <div className="border-t border-neutral-800 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
          <Link href="/" className="relative z-20 flex items-center space-x-3 px-1 py-1 text-base font-semibold text-white">
            <Image
              src="/assets/images/main_logo.png"
              alt="BrokeNoMore"
              width={32}
              height={32}
              className="object-contain rounded-full"
            />
            <span className="font-bold text-base text-white">BrokeNoMore</span>
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
              className="relative text-base font-medium text-neutral-300 hover:text-white block py-1.5 w-full transition-colors"
            >
              {item.name}
            </Link>
          ))}
          {!user ? (
            <div className="flex w-full flex-col gap-3 mt-3 pt-3 border-t border-neutral-800">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="secondary"
                href="/signin"
                className="w-full py-2.5"
              >
                Sign In
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                href="/signup"
                className="w-full py-2.5"
              >
                Sign Up
              </NavbarButton>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2 mt-3 pt-3 border-t border-neutral-800">
              <p className="text-xs text-neutral-400 px-1 truncate">{user.email}</p>
              <Link
                href="/delete-account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left py-2 px-1 text-sm text-orange-400 hover:text-orange-300 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 px-1 text-sm text-red-400 hover:text-red-300 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
}

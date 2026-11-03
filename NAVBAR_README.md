# Navbar Component & Subcomponents Documentation

This document contains the entire code, architecture breakdown, and implementation details for the responsive, animated, fixed-sticky floating navbar system used in **BrokeNoMore**.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites & Dependencies](#prerequisites--dependencies)
3. [File Tree](#file-tree)
4. [Full Source Code](#full-source-code)
   - [1. Resizable Navbar UI (`components/ui/resizable-navbar.tsx`)](#1-resizable-navbar-ui-componentsuiresizable-navbartsx)
   - [2. Main Application Navbar (`app/components/Navbar.tsx`)](#2-main-application-navbar-appcomponentsnavbartsx)
   - [3. Class Name Utility (`lib/utils.ts`)](#3-class-name-utility-libutilsts)
   - [4. Supabase Client Utility (`lib/supabase.ts`)](#4-supabase-client-utility-libsupabasets)
5. [Key Features & How It Works](#key-features--how-it-works)
   - [Fixed Sticky Positioning & Anti-Disappearance](#fixed-sticky-positioning--anti-disappearance)
   - [Dynamic Scroll Pill & Backdrop Blur](#dynamic-scroll-pill--backdrop-blur)
   - [Magnetic / Hover Tab Indicator](#magnetic--hover-tab-indicator)
   - [Mobile Drawer & Body Scroll Locking](#mobile-drawer--body-scroll-locking)
   - [Supabase Authentication & Profile Avatar](#supabase-authentication--profile-avatar)
6. [How to Use in Your App](#how-to-use-in-your-app)

---

## Architecture Overview

The navbar is composed into two main layers:

1. **Headless / Presentational UI Layer (`components/ui/resizable-navbar.tsx`)**:
   - Built with **Framer Motion (`motion/react`)** and **Tailwind CSS**.
   - Implements `fixed inset-x-0 top-0 z-50` to guarantee the navbar never scrolls out of view or disappears.
   - Handles the floating/shrink-on-scroll capsule animations, backdrop blur, hover indicator tabs, and mobile navigation drawer primitives.

2. **Application State & Feature Layer (`app/components/Navbar.tsx`)**:
   - Manages Supabase Auth session state (`user`, `loading`, `userProfile`).
   - Conditionally injects routes (e.g., showing **Dashboard** only when signed in).
   - Handles user avatar fallback, profile dropdown toggle, logout handler.
   - Locks body scroll when mobile menu is open and closes on `Esc` or outside clicks.

---

## Prerequisites & Dependencies

```bash
npm install motion @tabler/icons-react clsx tailwind-merge @supabase/supabase-js
```

---

## Full Source Code

### 1. Resizable Navbar UI (`components/ui/resizable-navbar.tsx`)

```tsx
"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import React, { useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
}

export const ResizableNavbar = ({ children, className }: NavbarProps) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 40) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 pointer-events-auto",
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.header>
  );
};

export const Navbar = ResizableNavbar;

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(16px)" : "blur(0px)",
        boxShadow: visible
          ? "0 4px 30px rgba(0, 0, 0, 0.5), 0 1px 1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "min(92%, 1060px)" : "100%",
        y: visible ? 12 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 30,
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-full px-6 py-2.5 lg:flex transition-colors duration-300",
        visible
          ? "bg-[#18181b]/85 border border-white/10"
          : "bg-transparent",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.nav
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "hidden flex-1 flex-row items-center justify-center space-x-1 lg:space-x-2 text-sm font-medium text-neutral-300 lg:flex",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          key={`link-${idx}`}
          href={item.link}
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-3 py-1.5 text-neutral-300 hover:text-white transition-colors duration-150 whitespace-nowrap text-sm font-medium"
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-white/10"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.nav>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(16px)" : "blur(0px)",
        boxShadow: visible
          ? "0 4px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "calc(100% - 1.5rem)" : "100%",
        borderRadius: visible ? "1.25rem" : "0rem",
        y: visible ? 8 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 30,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full flex-col items-center justify-between px-4 py-3 lg:hidden transition-colors duration-300",
        visible
          ? "bg-[#18181b]/90 border border-white/10"
          : "bg-transparent",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-2xl bg-[#18181b] border border-white/10 px-6 py-6 shadow-2xl",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle mobile menu"
      className="p-1 rounded-md text-white hover:bg-white/10 transition-colors focus:outline-none"
    >
      {isOpen ? <IconX className="w-6 h-6" /> : <IconMenu2 className="w-6 h-6" />}
    </button>
  );
};

export const NavbarLogo = () => {
  return (
    <a
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-semibold text-white"
    >
      <img
        src="/assets/images/main_logo.png"
        alt="logo"
        width={32}
        height={32}
        className="rounded-full"
      />
      <span className="font-bold text-white text-base">BrokeNoMore</span>
    </a>
  );
};

type NavbarButtonProps = {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  [key: string]: any;
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  onClick,
  ...props
}: NavbarButtonProps) => {
  const baseStyles =
    "px-4 py-2 rounded-full text-xs sm:text-sm font-medium relative cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition duration-200 inline-flex items-center justify-center text-center";

  const variantStyles = {
    primary:
      "bg-white text-black hover:bg-neutral-200 shadow-md",
    secondary:
      "bg-transparent text-white border border-white/20 hover:bg-white/10",
    dark:
      "bg-neutral-800 text-white hover:bg-neutral-700 border border-white/10",
    gradient:
      "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:opacity-90",
  };

  const tagProps: any = { ...props };
  if (href) tagProps.href = href;
  if (onClick) tagProps.onClick = onClick;

  const Component = Tag as React.ComponentType<any>;

  return (
    <Component
      {...tagProps}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {children}
    </Component>
  );
};
```

---

### 2. Main Application Navbar (`app/components/Navbar.tsx`)

```tsx
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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
      { name: "Pricing", link: "/pricing" },
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
      <NavBody>
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

        <NavItems items={navItems} />

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
```

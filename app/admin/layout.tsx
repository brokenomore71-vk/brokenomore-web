"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconUsers,
  IconCreditCard,
  IconGift,
  IconSettings,
  IconLogout,
  IconChartBar,
} from "@tabler/icons-react";

const ADMIN_EMAIL = "admin@brokenomore.in";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        await supabase.auth.signOut();
        router.push("/signin");
        return;
      }
      
      if (!session) {
        router.push("/signin");
        return;
      }

      // Check if user is admin
      if (session.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        // Not admin, redirect to dashboard
        router.push("/dashboard");
        return;
      }

      setUser(session.user);
    } catch (error: any) {
      console.error("Error checking auth:", error);
      await supabase.auth.signOut();
      router.push("/signin");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const links = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <IconLayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
      ),
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: (
        <IconUsers className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
      ),
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: (
        <IconCreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
      ),
    },
    {
      label: "Offers",
      href: "/admin/offers",
      icon: (
        <IconGift className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
      ),
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: (
        <IconChartBar className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
      ),
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B46C1] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={
                    pathname === link.href
                      ? "bg-neutral-200 dark:bg-neutral-700 rounded-lg"
                      : ""
                  }
                />
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-col gap-2">
              <SidebarLink
                link={{
                  label: "Logout",
                  href: "#",
                  icon: (
                    <IconLogout className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
                  ),
                }}
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-y-auto w-full md:w-auto">
        {children}
      </main>
    </div>
  );
}

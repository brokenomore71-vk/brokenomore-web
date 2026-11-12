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
import Link from "next/link";

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
  onClose: () => void;
}

export const ResizableNavbar = ({ children, className }: NavbarProps) => {
  // Use window scroll directly so it reliably detects scrolling anywhere on the page
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
      // Fixed sticky header that stays at the top of the viewport at all times
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

export const Navbar = ResizableNavbar; // Alias for compatibility

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
        <Link
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
        </Link>
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

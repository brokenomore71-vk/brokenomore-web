"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
);

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative" onBlur={() => setIsOpen(false)}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
              setIsOpen,
            });
          }
          return child;
        })}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    "aria-label"?: string;
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
  }
>(({ className, children, isOpen, setIsOpen, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setIsOpen?.(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B46C1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-neutral-950 dark:focus:ring-[#6B46C1]",
        className
      )}
      {...props}
    >
      {children || context.value}
      <svg
        className="h-4 w-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  return <span>{context.value || placeholder}</span>;
};

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
  }
>(({ className, children, isOpen, setIsOpen, ...props }, ref) => {
  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-950 dark:text-white shadow-md",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
  }
>(({ className, children, value, isOpen, setIsOpen, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        context.value === value && "bg-gray-100 dark:bg-neutral-700",
        className
      )}
      onClick={() => {
        context.onValueChange(value);
        setIsOpen?.(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };

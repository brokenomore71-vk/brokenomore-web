"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  name: string;
  items: FAQItem[];
}

interface FAQSectionProps {
  categories: FAQCategory[];
  className?: string;
}

export const FAQSection = ({ categories, className }: FAQSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || "");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const currentCategory = categories.find((cat) => cat.id === selectedCategory);
  const allItems = currentCategory?.items || [];

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className={cn("bg-gray-50 min-h-screen py-20 px-4 sm:px-6 lg:px-8", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
            We&apos;ve got answers
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Find answers to common questions about BrokeNoMore and get the help you need.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Support Navigation */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-black mb-6">Support</h2>
            <nav className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setOpenItems(new Set()); // Reset open items when category changes
                  }}
                  className={cn(
                    "block w-full text-left py-2 px-3 rounded-md transition-colors",
                    selectedCategory === category.id
                      ? "bg-gray-200 text-black font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Column - FAQ Items */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {allItems.map((item) => {
                const isOpen = openItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-black pr-4">
                        {item.question}
                      </h3>
                      <svg
                        className={cn(
                          "w-5 h-5 text-gray-600 flex-shrink-0 transition-transform",
                          isOpen && "rotate-180"
                        )}
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
                    {isOpen && (
                      <div className="px-6 pb-5">
                        <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CartProvider } from "../_components/CartContext";
import CheckoutForm from "../_components/CheckoutForm";

function CheckoutContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/merchandise")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Back to shop"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-gray-900">
                Checkout
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Complete your order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CheckoutForm />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutContent />
    </CartProvider>
  );
}

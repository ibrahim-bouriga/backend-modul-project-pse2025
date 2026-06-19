"use client";

import React, { useState, useEffect } from "react";
import { Product, ProductCategory } from "./_components/types";
import { CartProvider, useCart } from "./_components/CartContext";
import ProductGrid from "./_components/ProductGrid";
import CategoryFilter from "./_components/CategoryFilter";
import ShoppingCart from "./_components/ShoppingCart";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function MerchandiseContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openCart, itemCount } = useCart();

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/products?limit=100`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        
        const data = await response.json();
        const products = data.data ?? [];
        setProducts(products);
        setFilteredProducts(products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const handleCategoryChange = (category: ProductCategory | "all") => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 mb-2">
                Feature Module
              </p>
              <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-gray-900">
                Merchandise Shop
              </h1>
              <p className="text-gray-600 text-base mt-2 max-w-2xl">
                Shop our exclusive collection of branded merchandise. Add items to your cart and
                check out securely.
              </p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
              aria-label="Open shopping cart"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Products Count */}
        {!isLoading && !error && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              {selectedCategory !== "all" && ` in ${selectedCategory}`}
            </p>
          </div>
        )}

        {/* Product Grid */}
        <ProductGrid products={filteredProducts} isLoading={isLoading} />
      </div>

      {/* Shopping Cart Sidebar */}
      <ShoppingCart />
    </div>
  );
}

export default function MerchandisePage() {
  return (
    <CartProvider>
      <MerchandiseContent />
    </CartProvider>
  );
}


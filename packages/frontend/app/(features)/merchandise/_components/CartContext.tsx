"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Cart, CartContextType } from "./types";

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [total, setTotal] = useState<string>("0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  // Initialize session ID on mount
  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  // Fetch cart from API
  const refreshCart = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Cart doesn't exist yet, that's okay
          setCart(null);
          setTotal("0.00");
          return;
        }
        throw new Error("Failed to fetch cart");
      }
      
      const data = await response.json();
      setCart(data.cart);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
      console.error("Error fetching cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Load cart on mount and when sessionId changes
  useEffect(() => {
    if (sessionId) {
      refreshCart();
    }
  }, [sessionId, refreshCart]);

  // Add item to cart
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add item to cart");
      }
      
      await refreshCart();
      setIsCartOpen(true); // Open cart after adding item
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
      console.error("Error adding to cart:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${sessionId}/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update quantity");
      }
      
      await refreshCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
      console.error("Error updating quantity:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${sessionId}/${itemId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove item");
      }
      
      await refreshCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
      console.error("Error removing item:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart (local only)
  const clearCart = () => {
    setCart(null);
    setTotal("0.00");
  };

  // Cart UI controls
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Calculate item count
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const value: CartContextType = {
    cart,
    total,
    itemCount,
    isLoading,
    error,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

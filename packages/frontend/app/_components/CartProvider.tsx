"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BACKEND_URL } from "../_lib/api";

interface CartItem {
    id: number;
    variantId: number;
    quantity: number;
    sku: string;
    options: Record<string, string>;
    name: string;
    imageUrl: string | null;
    price: number;
}

interface CartContextValue {
    items: CartItem[];
    subtotal: number;
    itemCount: number;
    isLoading: boolean;
    addItem: (variantId: number, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart muss innerhalb von CartProvider verwendet werden");
    return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const refreshCart = useCallback(async () => {
        const res = await fetch(`${BACKEND_URL}/api/cart`, {
            credentials: "include",
        });
        const data = await res.json();

        const cartItems: CartItem[] = (data.cart?.items ?? []).map((item: any) => ({
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            sku: item.variant.sku,
            options: item.variant.options,
            name: item.variant.product.name,
            imageUrl: item.variant.product.imageUrl,
            price: Number(item.variant.product.basePrice) + Number(item.variant.priceDelta),
        }));

        setItems(cartItems);
        setSubtotal(Number(data.summary?.subtotal ?? 0));
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    useEffect(() => {
        function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                refreshCart();
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [refreshCart]);

    async function addItem(variantId: number, quantity = 1) {
        await fetch(`${BACKEND_URL}/api/cart/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ variantId, quantity }),
        });
        await refreshCart();
    }

    async function updateQuantity(itemId: number, quantity: number) {
        await fetch(`${BACKEND_URL}/api/cart/items/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ quantity }),
        });
        await refreshCart();
    }

    async function removeItem(itemId: number) {
        await fetch(`${BACKEND_URL}/api/cart/items/${itemId}`, {
            method: "DELETE",
            credentials: "include",
        });
        await refreshCart();
    }

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <CartContext.Provider
            value={{ items, subtotal, itemCount, isLoading, addItem, updateQuantity, removeItem, refreshCart }}
        >
            {children}
        </CartContext.Provider>
    );
}
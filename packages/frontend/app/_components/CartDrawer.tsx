"use client";

import { useCart } from "./CartProvider";
import { useState } from "react";
import { BACKEND_URL } from "../_lib/api";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { items, subtotal, updateQuantity, removeItem, refreshCart } = useCart();
    const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

    if (!isOpen) return null;

    async function handleCheckout() {
        setCheckoutStatus("loading");
        try {
            const res = await fetch(`${BACKEND_URL}/api/cart/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                setCheckoutStatus("error");
                return;
            }

            await refreshCart();
            setCheckoutStatus("done");
        } catch {
            setCheckoutStatus("error");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Hintergrund-Overlay */}
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            {/* Drawer-Panel */}
            <div className="relative w-full max-w-sm bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black uppercase tracking-wide">Shopping Cart</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">
                        ×
                    </button>
                </div>

                {checkoutStatus === "done" ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                        <p className="text-lg font-bold">Order placed!</p>
                        <p className="text-zinc-500 text-sm">Thank you for your purchase.</p>
                        <button
                            onClick={() => {
                                setCheckoutStatus("idle");
                                onClose();
                            }}
                            className="mt-4 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase"
                        >
                            Close
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-zinc-500 text-sm flex-1 flex items-center justify-center">
                        Your cart is empty.
                    </p>
                ) : (
                    <>
                        <div className="flex-1 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3 border-b border-zinc-900 pb-4">
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {Object.values(item.options).join(" / ")}
                                        </p>
                                        <p className="text-sm font-bold mt-1">{item.price.toFixed(2)} €</p>

                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                className="w-6 h-6 rounded-full border border-zinc-700 text-xs"
                                            >
                                                −
                                            </button>
                                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 rounded-full border border-zinc-700 text-xs"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="ml-auto text-xs text-zinc-600 hover:text-red-400"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-zinc-800 pt-4 mt-4 space-y-3">
                            <div className="flex justify-between font-bold">
                                <span>Subtotal</span>
                                <span>{subtotal.toFixed(2)} €</span>
                            </div>

                            {checkoutStatus === "error" && (
                                <p className="text-red-400 text-xs">
                                    Checkout failed. Please try again.
                                </p>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={checkoutStatus === "loading"}
                                className="w-full bg-white text-black font-bold uppercase tracking-wide py-3 rounded-full disabled:opacity-40"
                            >
                                {checkoutStatus === "loading" ? "Processing..." : "Checkout"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
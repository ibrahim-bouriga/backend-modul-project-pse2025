"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import CartDrawer from "./CartDrawer";

export default function CartButton() {
    const { itemCount } = useCart();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="relative w-12 h-12 rounded-full flex items-center justify-center transition hover:opacity-90"
                style={{ backgroundColor: "#cc0000" }}
                aria-label="Warenkorb öffnen"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>

                {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950">
                        {itemCount}
                    </span>
                )}
            </button>

            <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
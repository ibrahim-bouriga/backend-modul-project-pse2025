"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

interface Variant {
    id: number;
    sku: string;
    options: Record<string, string>;
    priceDelta: string;
    stock: number;
}

export default function AddToCartForm({ variants }: { variants: Variant[] }) {
    const { addItem } = useCart();
    const [selectedVariantId, setSelectedVariantId] = useState<number>(variants[0]?.id ?? 0);
    const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

    const selectedVariant = variants.find((v) => v.id === selectedVariantId);
    const optionKeys = Array.from(new Set(variants.flatMap((v) => Object.keys(v.options))));

    async function handleAddToCart() {
        setStatus("loading");
        await addItem(selectedVariantId, 1);
        setStatus("done");
        setTimeout(() => setStatus("idle"), 1500);
    }

    if (variants.length === 0) {
        return <p className="text-zinc-500 text-sm">Keine Varianten verfügbar.</p>;
    }

    return (
        <div className="space-y-4">
            {optionKeys.length > 0 && (
                <div className="space-y-3">
                    {optionKeys.map((key) => (
                        <div key={key}>
                            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">{key}</p>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(variants.map((v) => v.options[key]))).map((value) => {
                                    const matchingVariant = variants.find(
                                        (v) =>
                                            v.options[key] === value &&
                                            optionKeys.every(
                                                (k) =>
                                                    k === key ||
                                                    v.options[k] === selectedVariant?.options[k]
                                            )
                                    );
                                    const isActive = selectedVariant?.options[key] === value;

                                    return (
                                        <button
                                            key={value}
                                            disabled={!matchingVariant}
                                            onClick={() => matchingVariant && setSelectedVariantId(matchingVariant.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                                                isActive
                                                    ? "bg-white text-black border-white"
                                                    : matchingVariant
                                                    ? "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                                                    : "border-zinc-900 text-zinc-700 cursor-not-allowed"
                                            }`}
                                        >
                                            {value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-sm text-zinc-500">
                {selectedVariant && selectedVariant.stock > 0
                    ? `${selectedVariant.stock} auf Lager`
                    : "Nicht auf Lager"}
            </p>

            <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0 || status === "loading"}
                className="w-full bg-white text-black font-bold uppercase tracking-wide py-3 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                {status === "loading" ? "Wird hinzugefügt..." : status === "done" ? "Hinzugefügt ✓" : "In den Warenkorb"}
            </button>
        </div>
    );
}
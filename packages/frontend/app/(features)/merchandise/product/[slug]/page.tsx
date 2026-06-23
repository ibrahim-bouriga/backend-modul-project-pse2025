//product/[slug]/page.tsx

import { BACKEND_URL } from "../../../../_lib/api";
import { notFound } from "next/navigation";
import AddToCartForm from "../../../../_components/AddToCartForm";
import CartButton from "../../../../_components/CartButton";

interface Variant {
    id: number;
    sku: string;
    options: Record<string, string>;
    priceDelta: string;
    stock: number;
}

interface Product {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    basePrice: string;
    imageUrl: string | null;
    attributes: Record<string, unknown>;
    category: { name: string; slug: string };
    variants: Variant[];
}

async function getProduct(slug: string): Promise<Product | null> {
    const res = await fetch(`${BACKEND_URL}/api/products/${slug}`, {
        next: { revalidate: 60 },
    });

    if (res.status === 404) return null;
    return res.json();
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto px-8 py-16">
            <div className="flex justify-end">
                <CartButton />
            </div>

            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
                {product.category.name}
            </p>
            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight mb-6">
                {product.name}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {product.imageUrl && (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full rounded-2xl border border-zinc-800"
                    />
                )}

                <div className="space-y-6">
                    <p className="text-zinc-400 leading-relaxed">{product.description}</p>

                    <p className="text-3xl font-black">
                        {Number(product.basePrice).toFixed(2)} €
                    </p>

                    <AddToCartForm variants={product.variants} />

                    {Object.keys(product.attributes ?? {}).length > 0 && (
                        <div className="border-t border-zinc-800 pt-4 space-y-1">
                            {Object.entries(product.attributes).map(([key, value]) => (
                                <p key={key} className="text-sm text-zinc-500">
                                    <span className="uppercase tracking-wide text-zinc-600">{key}:</span>{" "}
                                    {String(value)}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
//import BackendHealthCheck from "./product/ExampleComponent";
import { BACKEND_URL } from "../../_lib/api";
import FilterBar from "../../_components/FilterBar";
import Link from "next/link";
import CartButton from "../../_components/CartButton";

interface Product {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    basePrice: string;
    imageUrl: string | null;
    category: { name: string; slug: string };
}

interface Category {
    id: number;
    slug: string;
    name: string;
}

async function getProducts(searchParams: { category?: string; sort?: string }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.sort) params.set("sort", searchParams.sort);

    const hasFilters = Boolean(searchParams.category || searchParams.sort);

    const res = await fetch(`${BACKEND_URL}/api/products?${params.toString()}`, {
        cache: hasFilters ? "no-store" : "force-cache",
    });
    return res.json();
}

async function getCategories(): Promise<Category[]> {
    const products = await fetch(`${BACKEND_URL}/api/products`, { cache: "force-cache" }).then((r) => r.json());
    const seen = new Map<string, Category>();
    for (const p of products as Product[]) {
        seen.set(p.category.slug, { id: 0, slug: p.category.slug, name: p.category.name });
    }
    return Array.from(seen.values());
}

export default async function MerchandisePage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; sort?: string }>;
}) {
    const params = await searchParams;
    const [products, categories] = await Promise.all([getProducts(params), getCategories()]);

    return (
        <div className="max-w-4xl mx-auto px-8 py-16 space-y-10">
            <div>
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
                    Feature Module
                </p>
                <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-4">
                    Merchandise
                </h1>
                <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
                    Shop our exclusive collection of branded merchandise!
                </p>
            </div>

            <div className = "flex items-center justify-between gap-4">
                <FilterBar
                categories={categories}
                activeCategory={params.category}
                activeSort={params.sort}
            />
            <CartButton />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                    <Link
                       key={product.id}
                       href={`/merchandise/product/${product.slug}`}
                       className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden block hover:border-zinc-600 transition"
                    >
                        {product.imageUrl && (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-6">
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2">
                                {product.category.name}
                            </p>
                            <h2 className="font-bold text-lg mb-2">{product.name}</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                {product.description}
                            </p>
                            <p className="font-black text-xl">
                                {Number(product.basePrice).toFixed(2)} €
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {products.length === 0 && (
                <p className="text-zinc-500 text-center py-12">
                    No products found in this category.
                </p>
            )}
        </div>
    );
}
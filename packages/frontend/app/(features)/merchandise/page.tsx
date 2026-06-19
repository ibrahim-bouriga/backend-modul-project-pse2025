//import BackendHealthCheck from "./product/ExampleComponent";
import { BACKEND_URL } from "../../_lib/api";

interface Product {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    basePrice: string;
    imageUrl: string | null;
    category: { name: string; slug: string };
}

async function getProducts(): Promise<Product[]> {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
        cache: "no-store",
    });
    return res.json();
}

export default async function MerchandisePage() {
    const products = await getProducts();

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
                    Shop our exclusive collection of branded merchandise. Add items
                    to your cart and check out securely — powered by a fully-featured
                    REST API with persistent cart state.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
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
                    </div>
                ))}
            </div>
        </div>
    );
}
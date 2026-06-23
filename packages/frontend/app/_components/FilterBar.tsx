"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Category {
    slug: string;
    name: string;
}

export default function FilterBar({
    categories,
    activeCategory,
    activeSort,
}: {
    categories: Category[];
    activeCategory?: string;
    activeSort?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function updateParam(key: string, value: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex flex-wrap items-center gap-3 w-full">
            <button
                onClick={() => updateParam("category", null)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
                    !activeCategory
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600"
                }`}
            >
                All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.slug}
                    onClick={() => updateParam("category", cat.slug)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
                        activeCategory === cat.slug
                            ? "bg-white text-black"
                            : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600"
                    }`}
                >
                    {cat.name}
                </button>
            ))}

            <select
                value={activeSort ?? ""}
                onChange={(e) => updateParam("sort", e.target.value || null)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold uppercase tracking-wide rounded-full px-4 py-2 min-w-[160px]"
        >
                <option value="price_asc">Price ascending</option>
                <option value="price_desc">Price descending</option>
            </select>
        </div>
    );
}
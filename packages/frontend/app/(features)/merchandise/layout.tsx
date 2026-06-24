import {Suspense} from "react";
import { CartProvider } from "../../_components/CartProvider";

export default function MerchandiseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="text-zinc-500">Loading merchandise…</div>}>
            <CartProvider>{children}</CartProvider>
        </Suspense>
    );
}
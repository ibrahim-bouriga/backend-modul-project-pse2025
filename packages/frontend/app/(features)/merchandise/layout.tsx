import { CartProvider } from "../../_components/CartProvider";

export default function MerchandiseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <CartProvider>{children}</CartProvider>;
}
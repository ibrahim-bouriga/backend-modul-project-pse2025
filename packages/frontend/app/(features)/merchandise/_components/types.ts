// Product Types
export type ProductCategory = "apparel" | "accessories" | "collectibles";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string; // Decimal as string
  category: ProductCategory;
  imageUrl: string;
  stock: number;
  available: boolean;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    imageUrl: string;
    stock: number;
  };
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
}

export interface CartResponse {
  cart: Cart;
  total: string; // calculated total
}

// Order Types
export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderResponse {
  order: Order;
}

// Form Types
export interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Cart Context Types
export interface CartContextType {
  cart: Cart | null;
  total: string;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  isCartOpen: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
}

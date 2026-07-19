export type ShopStatus = "pending" | "active" | "suspended";

export interface Shop {
  _id: string;
  ownerUserId: string;
  shopName: string;
  description: string;
  address: string;
  logo: string;
  feePaid: boolean;
  status: ShopStatus;
  createdAt: string;
}

export type ProductStatus = "pending" | "approved" | "rejected";
export type ProductCondition = "new" | "used";

export interface ProductShopRef {
  _id: string;
  shopName: string;
  logo: string;
}

export interface Product {
  _id: string;
  shopId: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  category: string;
  price: number;
  condition: ProductCondition;
  stock: number;
  images: string[];
  status: ProductStatus;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  shop?: ProductShopRef;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "completed";

export interface OrderItem {
  productId: string;
  shopId: string;
  title: string;
  image: string;
  price: number;
  qty: number;
}

export interface Order {
  _id: string;
  buyerId: string;
  items: OrderItem[];
  totalAmount: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AdminStats {
  totals: {
    shops: number;
    products: number;
    orders: number;
    revenue: number;
  };
  signupsOverTime: { date: string; count: number }[];
  categorySplit: { category: string; count: number }[];
}

export interface ShopStats {
  salesOverTime: { date: string; total: number }[];
}

export interface PublicStats {
  shops: number;
  products: number;
  orders: number;
  users: number;
}

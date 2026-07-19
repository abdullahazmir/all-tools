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

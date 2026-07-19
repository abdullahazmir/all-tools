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

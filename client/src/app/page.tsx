import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ProductCard } from "@/components/ProductCard";
import type { Category, PaginatedProducts, PublicStats, Shop } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.categories as Category[];
}

async function getTrendingProducts(): Promise<PaginatedProducts["products"]> {
  const res = await fetch(`${API_URL}/products?sort=rating&limit=4`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.products;
}

async function getFeaturedShops(): Promise<Shop[]> {
  const res = await fetch(`${API_URL}/shops`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.shops as Shop[]).slice(0, 4);
}

async function getPublicStats(): Promise<PublicStats | null> {
  const res = await fetch(`${API_URL}/stats/public`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

const FAQ_ITEMS = [
  {
    q: "How much does it cost to sell on ToolBazaar?",
    a: "A one-time $49 registration fee activates your shop. After that, listing products is free — there's no per-sale commission taken by the platform.",
  },
  {
    q: "How long does product approval take?",
    a: "Every new listing is reviewed by our admin team before it goes live, typically within a day, to keep the catalog accurate and spam-free.",
  },
  {
    q: "Can I return a tool I bought?",
    a: "Returns are handled directly with the seller's shop — check the shop page for their contact details, or reach out via our Contact page and we'll help coordinate.",
  },
  {
    q: "Is payment secure?",
    a: "All payments are processed through Stripe. ToolBazaar never stores your card details.",
  },
];

export default async function HomePage() {
  const [categories, trendingProducts, featuredShops, stats] = await Promise.all([
    getCategories(),
    getTrendingProducts(),
    getFeaturedShops(),
    getPublicStats(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-50 to-white px-4 py-16 text-center md:min-h-[70vh] dark:from-neutral-900 dark:to-neutral-950">
        <h1 className="max-w-2xl text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-50">
          Tools from real shops, delivered to your door
        </h1>
        <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
          Browse grinders, drills, wrenches, and more from local hardware shops — or register
          your own shop and start selling today.
        </p>
        <HeroSearch />
        <div className="flex gap-3">
          <Link
            href="/explore"
            className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-800"
          >
            Explore Tools
          </Link>
          <Link
            href="/become-seller"
            className="rounded-lg border border-accent-600 px-6 py-3 text-sm font-medium text-accent-700 transition hover:bg-accent-50 dark:text-accent-600 dark:hover:bg-neutral-900"
          >
            Become a Seller
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Featured Categories
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c._id}
              href={`/explore?category=${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 p-4 text-center transition hover:border-brand-600 hover:shadow-sm dark:border-neutral-800"
            >
              <span className="text-3xl">{c.icon}</span>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="bg-light-gray px-4 py-14 dark:bg-neutral-900">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                Trending Products
              </h2>
              <Link href="/explore" className="text-sm text-brand-700 hover:underline dark:text-brand-100">
                View all →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trendingProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Shops */}
      {featuredShops.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Featured Shops
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredShops.map((shop) => (
              <Link
                key={shop._id}
                href={`/shops/${shop._id}`}
                className="rounded-xl border border-neutral-200 p-4 transition hover:shadow-sm dark:border-neutral-800"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  {shop.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.logo} alt={shop.shopName} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-3 font-medium text-neutral-900 dark:text-neutral-100">{shop.shopName}</p>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{shop.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-light-gray px-4 py-14 dark:bg-neutral-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">How It Works</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-100">For Buyers</p>
              <ol className="mt-3 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
                <li><strong>1. Browse</strong> — search or filter by category, price, and rating.</li>
                <li><strong>2. Buy</strong> — checkout securely with Stripe.</li>
                <li><strong>3. Review</strong> — rate your purchase to help other buyers.</li>
              </ol>
            </div>
            <div>
              <p className="text-sm font-semibold text-accent-600">For Sellers</p>
              <ol className="mt-3 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
                <li><strong>1. Register</strong> — pay a one-time $49 shop registration fee.</li>
                <li><strong>2. List</strong> — add products; our AI can help write descriptions.</li>
                <li><strong>3. Sell</strong> — once admin-approved, your products go live.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      {stats && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            <div>
              <p className="text-3xl font-bold text-brand-700 dark:text-brand-100">{stats.shops}</p>
              <p className="mt-1 text-sm text-neutral-500">Active Shops</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-700 dark:text-brand-100">{stats.products}</p>
              <p className="mt-1 text-sm text-neutral-500">Products Listed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-700 dark:text-brand-100">{stats.orders}</p>
              <p className="mt-1 text-sm text-neutral-500">Orders Fulfilled</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-700 dark:text-brand-100">{stats.users}</p>
              <p className="mt-1 text-sm text-neutral-500">Registered Users</p>
            </div>
          </div>
        </section>
      )}

      {/* Become a Seller CTA */}
      <section className="bg-accent-600 px-4 py-14 text-center text-white">
        <h2 className="text-2xl font-semibold">Have tools to sell?</h2>
        <p className="mx-auto mt-2 max-w-xl text-accent-50">
          Register your shop for a one-time $49 fee and start listing products to thousands of buyers.
        </p>
        <Link
          href="/become-seller"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-accent-700 transition hover:bg-accent-50"
        >
          Become a Seller
        </Link>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Frequently Asked Questions
        </h2>
        <div className="mt-6 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <summary className="cursor-pointer text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-brand-800 px-4 py-14 text-center text-white">
        <h2 className="text-2xl font-semibold">Stay in the loop</h2>
        <p className="mx-auto mt-2 max-w-xl text-brand-100">
          Get notified about new shops, tools, and platform updates.
        </p>
        <div className="mt-6">
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}

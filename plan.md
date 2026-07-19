# ToolBazaar — Multi-Vendor Hand & Machine Tools Marketplace

Agentic AI Project (Assignment 5, Project-2) build plan.

## 1. Overview

**Pitch:** A marketplace where physical tool shops register online, list their
inventory (grinders, drills, screwdrivers, wrenches, cutting pliers, etc. — up to
500-600 products per shop), get admin-approved, and sell to buyers who can search,
filter, and pay via Stripe.

**Tech stack**

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, Recharts |
| Backend | Node.js, Express.js, TypeScript, MongoDB (native `mongodb` driver) |
| Auth | BetterAuth (email/password + Google OAuth), JWT sessions, role-based middleware |
| Payments | Stripe (Checkout Sessions + webhooks) |
| AI | Google Gemini API |
| Repo | Monorepo: `/client` (Next.js), `/server` (Express) |

## 2. Roles & Auth

- **Admin** — approves sellers & products, platform oversight.
- **Seller** (shopkeeper) — registers shop, pays registration fee, submits products.
- **Buyer** (user) — browses, searches, buys, reviews.

BetterAuth handles email/password + Google login. Register page lets user pick
Buyer or "Apply as Seller" (seller path continues to fee payment). Login page has
3 demo-login buttons (Admin Demo / Seller Demo / Buyer Demo) that autofill seeded
credentials. Protected routes redirect unauthenticated users to `/login`; role
guards redirect unauthorized roles away from dashboards/actions.

## 3. Core Business Flow

1. Seller registers → creates shop profile → pays one-time registration fee via
   Stripe Checkout → webhook flips `shop.status: pending → active`.
2. Seller adds products via `/items/add` → saved as `status: pending`.
3. Admin reviews queue in `/dashboard/admin` → approve/reject → approved products
   go public.
4. Buyer browses `/explore`, searches by product name or **shop name**, filters
   (category, price range, rating, condition), sorts, paginates.
5. Buyer opens product details → adds to cart or buys now → Stripe Checkout →
   webhook creates/confirms `order`.
6. Buyer can review purchased products (rating + comment).
7. Seller sees orders/sales in their dashboard; admin sees platform-wide stats.

## 4. Data Models (MongoDB)

**users**: `name, email, passwordHash|oauthId, role: admin|seller|buyer, avatar, createdAt`

**shops**: `ownerUserId, shopName, logo, description, address, feePaid: bool, feePaymentId, status: pending|active|suspended, createdAt`

**products**: `shopId, title, shortDesc, fullDesc, category, price, condition: new|used, stock, images: string[], status: pending|approved|rejected, ratingAvg, ratingCount, createdAt`

**orders**: `buyerId, items: [{productId, qty, price}], totalAmount, stripePaymentIntentId, status: pending|paid|shipped|completed, createdAt`

**reviews**: `productId, userId, rating, comment, createdAt`

**categories**: `name, slug, icon`

**aiInteractions** (optional, powers recommendation improvement): `userId, type: view|purchase|search, productId, category, createdAt`

## 5. API Route Map (`/api/...`)

- `auth/*` — BetterAuth handlers (login, register, google callback, session)
- `shops` — `POST /` (register+fee init), `GET /`, `GET /:id`, `PATCH /:id/approve` (admin), `PATCH /:id/suspend` (admin)
- `products` — `GET /` (search/filter/sort/paginate), `GET /:id`, `POST /` (seller), `PATCH /:id` (seller edit / admin approve-reject), `DELETE /:id`
- `orders` — `POST /checkout` (create Stripe session), `GET /mine`, `GET /` (admin), `GET /shop/:shopId` (seller)
- `reviews` — `POST /`, `GET /product/:id`
- `payments/webhook` — Stripe webhook (routes fee-payment vs order-payment events)
- `ai/generate-description` — POST `{title, category, keywords, length}` → Gemini description
- `ai/recommendations` — GET `{userId, productId?}` → related/personalized product list

## 6. Pages (mapped to assignment requirements)

### Landing page (`/`)
- **Navbar** — sticky, full-width. Logged out: Home, Explore, About/Contact, Login/Register (≥3). Logged in: + Dashboard, Add Product (seller) / Cart (buyer), Orders, Profile, Logout (≥5).
- **Hero** (60-70vh) — search bar + rotating banner of featured tools/shops, CTA buttons ("Explore Tools", "Become a Seller").
- **7+ sections**: Featured Categories (grinding/drilling/cutting/hand tools/power tools), Top-Rated Shops, Trending Products, How It Works (buyer & seller steps), Platform Stats counters (shops/products/orders), Become-a-Seller CTA banner (fee info), Testimonials, FAQ, Newsletter signup.
- **Footer** — About, quick links, contact info, social links, payment method icons — all working links.

### Explore / Listing (`/explore`)
- Search bar (product name OR shop name).
- Filters (≥2 required, ship with 4): category, price range, rating, condition.
- Sort: price asc/desc, newest, top rated.
- Pagination (or infinite scroll).
- Skeleton loaders while fetching.
- Card grid: 4/row desktop, uniform size/radius; each card = image, title, short description, meta (price, rating), "View Details".

### Product Details (`/products/[id]`)
- Public. Image gallery, Overview/Description, Key Info/Specs table, Reviews & ratings, Related Products (AI recommendation engine), shop mini-card linking to shop page, "Buy Now" (Stripe).

### Shop Profile (`/shops/[id]`)
- Shop info + all their approved products (backs the "search by shop name" requirement).

### Auth
- `/login`, `/register` — validation + inline errors, 3 demo-login buttons (auto-fill), "Continue with Google" button, clean split-panel UI.

### Protected: Add Product (`/items/add`)
- Seller-only (redirect to `/login` otherwise). Fields: Title, short description, full description, price, category, condition, stock, image URL(s). "Generate with AI" button next to description fields (Content Generator). Submit → status `pending`.

### Protected: Manage Products (`/items/manage`)
- Seller-only. Table/grid of own products with status badge (pending/approved/rejected), actions: View, Delete. Responsive.

### Cart & Checkout (`/cart`, `/checkout`)
- Buyer cart, Stripe Checkout Session redirect, success/cancel pages.

### Become a Seller (`/become-seller`)
- Shop registration form → Stripe Checkout for registration fee → on webhook success, shop activated, seller role granted.

### Dashboards (role-protected)
- `/dashboard/admin` — pending shop approvals, pending product approvals, all orders, platform charts (Recharts: signups, sales, category split).
- `/dashboard/seller` — shop overview, fee/payment status, sales stats chart, quick links to add/manage products, incoming orders.
- `/dashboard/buyer` — order history, wishlist, profile settings, AI "recommended for you" section.

### Additional pages
- `/about`, `/contact` (min. 2 satisfied).

## 7. AI Features (2 required)

**A. AI Content Generator** — On `/items/add`, seller enters title + category +
a few keywords/specs; Gemini generates short + full description. Controls:
length selector (short/medium/long), Regenerate button, custom prompt template
per category (e.g. power tools vs hand tools phrasing). Directly solves the
"500-600 products per seller" authoring bottleneck.

**B. AI Smart Recommendation Engine** — Two surfaces: "Related Tools" on product
details page (same category/price band + Gemini re-ranking by relevance to the
current product), and "Recommended For You" on buyer dashboard/home (built from
`aiInteractions` — views, searches, purchases — plus category affinity). Supports
filtering/refinement (e.g. "more like this but cheaper"); improves as interaction
log grows.

*(Optional future stretch, not required for grading: AI Chat Assistant for buyer
navigation/support.)*

## 8. Stripe Integration

Two independent flows sharing one webhook endpoint (`/api/payments/webhook`),
disambiguated by Checkout Session `metadata.type`:
1. **Seller registration fee** — one-time Checkout Session (`metadata.type=seller_fee`) → on `checkout.session.completed`, set `shop.feePaid=true`, `shop.status=active`.
2. **Product purchase** — one-time Checkout Session per order (`metadata.type=order`, `metadata.orderId`) → on completion, set `order.status=paid`, decrement stock.

## 9. UI System

- 3 primary colors + 1 neutral — proposed industrial palette: Steel Blue (primary), Safety Orange (accent/CTA), Charcoal (text/dark neutral), Light Gray (background neutral).
- Consistent card component: fixed height/width, shared border-radius token, shared shadow/hover style, reused across Explore/Related/Dashboard lists.
- Responsive breakpoints: mobile (base), tablet (`md`), desktop (`lg`/`xl`) — grid collapses from 4 → 2 → 1 columns.

## 10. Build Phases

1. Monorepo scaffold (`/client` Next.js+TS+Tailwind, `/server` Express+TS), MongoDB Atlas connection, env config.
2. BetterAuth setup (email/password + Google), role field, JWT middleware, protected-route wrapper, demo-login seed accounts.
3. Shop registration + Stripe fee Checkout + webhook + admin shop-approval screen.
4. Product CRUD (seller), admin product-approval queue, category seed data.
5. Explore/listing page (search, filter, sort, pagination, skeletons) + Product Details page.
6. Cart, Checkout, Stripe order payment + webhook, Orders pages.
7. Reviews & ratings.
8. AI Content Generator (Gemini) wired into `/items/add`.
9. AI Recommendation Engine (related products + dashboard recommendations).
10. Dashboards (admin/seller/buyer) with Recharts stats.
11. Landing page (hero, 7+ sections), About/Contact, footer, full responsive/UI polish pass.
12. Deploy: client → Vercel, server → Railway/Render, DB → MongoDB Atlas. Final QA against every assignment checklist item.

## 11. Submission Checklist

- [x] Live website URL: https://all-tools-lilac.vercel.app (client, Vercel)
- [x] Live backend: https://toolbazaar-api.onrender.com (Express, Render)
- [x] GitHub repo link: https://github.com/abdullahazmir/all-tools (monorepo, `/client` + `/server`)
- [x] Google OAuth authorized redirect URI `https://all-tools-lilac.vercel.app/api/auth/callback/google` added in Google Cloud Console, `SERVER_URL` env var switched to Vercel domain, confirmed working
- [ ] All 13 assignment sections verified against this plan before submitting

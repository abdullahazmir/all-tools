# ToolBazaar — Task Breakdown

Granular implementation checklist derived from `plan.md`. Work top to bottom —
each phase depends on the previous one. Check items off as completed.

---

## Phase 0 — Scaffold (DONE)

- [x] Monorepo `git init`, remote `origin` → `abdullahazmir/all-tools`
- [x] `/client` — Next.js (App Router) + TypeScript + Tailwind + ESLint
- [x] `/server` — Express + TypeScript, native `mongodb` driver (not Mongoose)
- [x] `server/src/config/env.ts` — env loader
- [x] `server/src/config/db.ts` — `connectDB()` / `getDB()`
- [x] `server/src/app.ts` — express app, cors, cookie-parser, `/api/health`, 404 + error handler
- [x] `server/src/index.ts` — entrypoint
- [x] `server/src/models/{user,shop,product,order,review,category}.ts` — typed collection getters
- [x] `.env.example` (server), root `.gitignore`
- [x] Initial commit + push to `origin/master`

---

## Phase 1 — Env & Infra Setup

- [ ] Create MongoDB Atlas cluster + database `toolbazaar`, get connection string
- [ ] Fill `server/.env` from `.env.example` (Mongo URI, `CLIENT_URL=http://localhost:3000`)
- [ ] Create Google Cloud OAuth client (web app), get `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, add `http://localhost:3000` + `http://localhost:5000` redirect URIs
- [ ] Create Stripe account (test mode), get `STRIPE_SECRET_KEY`, install Stripe CLI, `stripe listen` → get `STRIPE_WEBHOOK_SECRET`
- [ ] Create Gemini API key (Google AI Studio), set `GEMINI_API_KEY`
- [ ] `client/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:5000/api`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Verify `npm run dev` boots server and connects to Atlas (check `MongoDB connected` log)
- [ ] Verify `npm run dev` boots client at `localhost:3000`

---

## Phase 2 — Auth (BetterAuth + roles)

**Server**
- [ ] Install/configure `better-auth` instance (`server/src/auth.ts`) — email/password + Google provider
- [ ] Extend BetterAuth user schema with `role: "admin"|"seller"|"buyer"` (default `"buyer"`)
- [ ] Mount BetterAuth handler at `/api/auth/*` in `app.ts`
- [ ] `server/src/middleware/requireAuth.ts` — verifies session, attaches `req.user`
- [ ] `server/src/middleware/requireRole.ts` — `requireRole("admin"|"seller")` guard
- [ ] Seed script `server/src/scripts/seed.ts` — creates 3 demo accounts (admin/seller/buyer) with known passwords

**Client**
- [ ] BetterAuth client setup (`client/src/lib/auth-client.ts`)
- [ ] `/login` page — email/password form, validation (zod + react-hook-form), "Continue with Google" button, 3 demo-login buttons (autofill + submit)
- [ ] `/register` page — name/email/password, role choice (Buyer / Apply as Seller → redirects to `/become-seller` after signup)
- [ ] `AuthProvider` / session hook (`useSession`)
- [ ] `middleware.ts` (Next.js) or client-side guard — redirect unauthenticated users hitting protected routes to `/login`
- [ ] Role-based route guard component (`<RequireRole role="admin">`)

**Verify:** register buyer, login, login via each demo button, Google login round-trip, logout.

---

## Phase 3 — Shops & Seller Registration Fee

**Server**
- [ ] `server/src/controllers/shopController.ts` — create shop (pending), get shop by id, list shops, admin approve/suspend
- [ ] `server/src/routes/shopRoutes.ts` — `POST /api/shops`, `GET /api/shops`, `GET /api/shops/:id`, `PATCH /api/shops/:id/approve` (admin), `PATCH /api/shops/:id/suspend` (admin)
- [ ] `server/src/controllers/paymentController.ts` — `POST /api/payments/seller-fee-checkout` → creates Stripe Checkout Session (`metadata.type=seller_fee`, `metadata.shopId`)
- [ ] `server/src/routes/webhookRoutes.ts` — `POST /api/payments/webhook` (raw body parser), handle `checkout.session.completed`: if `type=seller_fee` → set `shop.feePaid=true`, `status=active`, bump user role to `seller`

**Client**
- [ ] `/become-seller` page — shop form (name, description, address, logo URL) → on submit, create shop + redirect to Stripe Checkout
- [ ] `/become-seller/success` and `/become-seller/cancel` pages
- [ ] Shop status banner in seller dashboard (pending fee / active / suspended)

**Verify:** register as seller, pay test-card fee via Stripe test mode, confirm webhook flips shop to active and role to seller.

---

## Phase 4 — Products (CRUD + Approval)

**Server**
- [ ] Seed `categories` collection (grinding, drilling, cutting, hand tools, power tools, measuring, safety gear, …)
- [ ] `server/src/controllers/productController.ts` — create (seller, status=pending), update (seller, own shop only), delete (seller/admin), get by id (public), list w/ query params (search, category, price range, rating, condition, sort, page/limit), admin approve/reject
- [ ] `server/src/routes/productRoutes.ts` — wire routes + `requireAuth`/`requireRole` guards per endpoint
- [ ] Text index on `products.title` + `shops.shopName` lookup for search

**Client**
- [ ] `/items/add` — protected (seller only), form (title, shortDesc, fullDesc, category select, price, condition, stock, image URL list), "Generate with AI" button stub (wired in Phase 8), submit → POST product
- [ ] `/items/manage` — protected (seller only), table/grid of own products, status badge, View + Delete actions
- [ ] Admin product-approval queue view (data table, approve/reject buttons) — build as part of `/dashboard/admin` in Phase 10, or stub now

**Verify:** seller adds a product (status pending), confirm it's invisible on public listing until admin approves.

---

## Phase 5 — Explore & Product Details

**Client**
- [ ] `client/src/components/ProductCard.tsx` — fixed size/radius, image, title, short desc, price/rating meta, "View Details" link
- [ ] `client/src/components/ProductCardSkeleton.tsx`
- [ ] `/explore` page — search bar (product name / shop name), filter panel (category, price range, rating, condition), sort dropdown (price asc/desc, newest, top rated), pagination controls, 4-col desktop grid → 2 → 1 responsive
- [ ] TanStack Query hook `useProducts(filters)` hitting `GET /api/products`
- [ ] `/products/[id]` page — image gallery, overview, specs table, reviews list, related products section (stub → Phase 9), shop mini-card (links to `/shops/[id]`), "Buy Now" button
- [ ] `/shops/[id]` page — shop header + grid of that shop's approved products (reuses `ProductCard`)

**Verify:** search by shop name returns that shop's products; combining 2+ filters narrows results correctly; pagination changes page without full reload.

---

## Phase 6 — Cart, Checkout, Orders

**Server**
- [ ] `server/src/controllers/orderController.ts` — create order from cart items (status=pending), `POST /api/orders/checkout` creates Stripe Checkout Session (`metadata.type=order`, `metadata.orderId`), `GET /api/orders/mine`, `GET /api/orders` (admin), `GET /api/orders/shop/:shopId` (seller)
- [ ] Webhook: handle `type=order` completion → set `order.status=paid`, decrement `product.stock` per item

**Client**
- [ ] Cart state (`zustand` or React context) — add/remove/update qty, persisted to localStorage
- [ ] `/cart` page — line items, subtotal, "Checkout" button
- [ ] `/checkout/success`, `/checkout/cancel` pages
- [ ] Buyer order history in `/dashboard/buyer`

**Verify:** add 2 products to cart, checkout with Stripe test card, confirm order appears as paid and stock decrements.

---

## Phase 7 — Reviews & Ratings

**Server**
- [ ] `server/src/controllers/reviewController.ts` — create review (buyer, must have purchased — check orders), list by product, recompute `product.ratingAvg`/`ratingCount` on write
- [ ] `server/src/routes/reviewRoutes.ts`

**Client**
- [ ] Review form + list on `/products/[id]` (star input, comment)
- [ ] Show ratingAvg/count on `ProductCard` and details page

**Verify:** only a buyer who purchased the product can submit a review; rating average updates immediately.

---

## Phase 8 — AI Feature A: Content Generator (Gemini)

**Server**
- [ ] `server/src/utils/gemini.ts` — Gemini client wrapper
- [ ] `server/src/controllers/aiController.ts` — `generateDescription({title, category, keywords, length})` → prompt template per category → returns `{shortDesc, fullDesc}`
- [ ] `server/src/routes/aiRoutes.ts` — `POST /api/ai/generate-description` (seller only)

**Client**
- [ ] Wire "Generate with AI" button on `/items/add`: length selector (short/medium/long), calls endpoint, fills description fields, "Regenerate" button
- [ ] Loading state while generating

**Verify:** generate descriptions for 3 different categories, confirm tone/length actually changes with selector, regenerate produces a different result.

---

## Phase 9 — AI Feature B: Smart Recommendation Engine

**Server**
- [ ] `aiInteractions` collection writes: log `view` (product details GET), `purchase` (order paid), `search` (explore query) — `server/src/models/aiInteraction.ts`
- [ ] `server/src/controllers/aiController.ts` — `getRelatedProducts(productId)` (same category/price band, Gemini re-rank top N by relevance) and `getRecommendedForUser(userId)` (build candidate set from interaction history + category affinity, optionally Gemini re-rank)
- [ ] `GET /api/ai/related/:productId`, `GET /api/ai/recommendations` (auth required)

**Client**
- [ ] "Related Tools" section on `/products/[id]` (fills the Phase 5 stub)
- [ ] "Recommended For You" section on `/dashboard/buyer` and/or home hero area
- [ ] Basic refine control (e.g. price slider / "cheaper alternatives" toggle) re-queries recommendations

**Verify:** view several products in one category, confirm recommendations shift toward that category; related products differ per product.

---

## Phase 10 — Dashboards (Admin / Seller / Buyer)

**Server**
- [ ] Stats endpoints: `GET /api/admin/stats` (totals: shops, products, orders, revenue; signups over time; category split), `GET /api/shops/:id/stats` (seller sales over time)

**Client**
- [ ] `/dashboard/admin` — pending shop approvals list, pending product approvals list, all-orders table, Recharts (line: signups/sales over time; pie/bar: category split)
- [ ] `/dashboard/seller` — shop status card (fee/active/suspended), Recharts sales chart, quick links to `/items/add` & `/items/manage`, incoming orders table
- [ ] `/dashboard/buyer` — order history, wishlist (optional), profile settings, recommendations section (from Phase 9)
- [ ] Role-based redirect: `/dashboard` → correct sub-dashboard based on `req.user.role`

**Verify:** each role only sees its own dashboard; admin approve action immediately reflects in explore listing.

---

## Phase 11 — Landing Page, Additional Pages, UI Polish

**Client**
- [ ] Global theme tokens (Tailwind config): primary (steel blue), accent (safety orange), neutral (charcoal/light gray)
- [ ] Shared `Navbar` (sticky, role-aware route list) and `Footer` (working links, contact info, social icons)
- [ ] `/` landing page sections (7+): Hero (60-70vh, search + slider/CTA), Featured Categories, Top-Rated Shops, Trending Products, How It Works, Platform Stats counters, Become-a-Seller CTA, Testimonials, FAQ, Newsletter
- [ ] `/about`, `/contact` pages
- [ ] Full responsive pass: mobile/tablet/desktop for every page built so far
- [ ] Replace any remaining placeholder text/images with real seeded content

**Verify:** resize through mobile/tablet/desktop breakpoints on every page; every navbar/footer link resolves (no dead links); no lorem-ipsum remains.

---

## Phase 12 — Deploy & Submit

- [ ] Deploy `/client` to Vercel — set env vars (`NEXT_PUBLIC_API_URL`, Google client id)
- [ ] Deploy `/server` to Railway/Render — set env vars incl. production Stripe keys + webhook secret pointed at deployed URL
- [ ] Point Stripe webhook (live/test) to deployed `/api/payments/webhook`
- [ ] Update Google OAuth authorized redirect URIs with production URLs
- [ ] Smoke-test full flow in production: register seller → pay fee → add product → admin approve → buyer buy → review
- [ ] Update `plan.md` submission checklist with live URL
- [ ] Final pass against assignment's 13 numbered sections
- [ ] Submit: live URL + GitHub repo link

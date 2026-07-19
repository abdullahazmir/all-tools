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

## Phase 1 — Env & Infra Setup (DONE)

- [x] Create MongoDB Atlas cluster + database `toolbazaar`, get connection string
- [x] Fill `server/.env` from `.env.example` (Mongo URI, `CLIENT_URL=http://localhost:3000`)
- [x] Create Google Cloud OAuth client (web app), get `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
- [x] Create Stripe account (test mode), get `STRIPE_SECRET_KEY` — `STRIPE_WEBHOOK_SECRET` still pending, needs Stripe CLI once webhook route exists (Phase 3)
- [x] Create Gemini API key (Google AI Studio), set `GEMINI_API_KEY` — non-standard format (not `AIzaSy...`) but confirmed working directly against the Gemini REST API in Phase 8, no action needed
- [x] `client/.env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [x] Verified server boots, connects to Atlas, `/api/health` responds `{"status":"ok"}`
- [x] Verified client boots at `localhost:3000`, HTTP 200

---

## Phase 2 — Auth (BetterAuth + roles) (DONE)

**Server**
- [x] `server/src/auth.ts` — BetterAuth instance (`better-auth/minimal` + `mongodbAdapter`, loaded via dynamic `import()` since better-auth is ESM-only and the server is CJS), email/password + Google provider, cached singleton via `getAuth()`
- [x] `role: "admin"|"seller"|"buyer"` additional field, default `"buyer"`, `input: false` (can't be self-assigned at signup — elevation happens server-side only)
- [x] Mounted at `/api/auth/*splat` in `app.ts`, before `express.json()` (better-auth reads the raw body itself)
- [x] `server/src/middleware/requireAuth.ts` — verifies session via `auth.api.getSession`, attaches `req.user`
- [x] `server/src/middleware/requireRole.ts` — `requireRole(...roles)` guard
- [x] `server/src/scripts/seed.ts` (`npm run seed`) — creates admin/seller/buyer demo accounts, password `Demo1234!`
- [x] `GET /api/me` — smoke-test route for `requireAuth`

**Client**
- [x] `client/src/lib/auth-client.ts` — `createAuthClient` from `better-auth/react`, exports `useSession`/`signIn`/`signUp`/`signOut`
- [x] `/login` — zod + react-hook-form validation, "Continue with Google", 3 demo buttons (autofill + auto-submit)
- [x] `/register` — name/email/password/confirm, Buyer vs Apply-as-Seller toggle → routes to `/become-seller` (Phase 3) on seller choice
- [x] `client/src/proxy.ts` — Next.js 16 renamed `middleware.ts` → `proxy.ts`/`export function proxy` (client's own `AGENTS.md` flagged this breaking change); redirects unauthenticated hits on protected prefixes to `/login?redirect=...`
- [x] `client/src/components/auth/RequireRole.tsx` — client-side role guard for dashboards (used starting Phase 10)

**Bug caught + fixed:** `models/user.ts` originally pointed at Mongo collection `"users"` (plural); BetterAuth's mongo adapter actually stores users in `"user"` (singular). Seed script's role-elevation update was silently matching zero documents. Fixed by repointing the model at the real collection.

**Verified live in browser** (Chrome, both dev servers running): demo-login button signs in and returns correct role end-to-end; register with "Apply as Seller" creates a `buyer`-role account and redirects to `/become-seller`; visiting `/items/add` while logged out redirects to `/login?redirect=%2Fitems%2Fadd`. Google OAuth round-trip not yet clicked through (needs a real Google consent screen) — client id/secret are wired and `signIn.social` is in place.

---

## Phase 3 — Shops & Seller Registration Fee (DONE)

**Server**
- [x] `server/src/controllers/shopController.ts` — create shop (idempotent, pending), get mine/by id, list active shops (public, `?search=`), admin list/approve/suspend
- [x] `server/src/routes/shopRoutes.ts` — `POST /api/shops`, `GET /api/shops`, `GET /api/shops/mine`, `GET /api/shops/:id`, `GET /api/shops/admin` (admin), `PATCH /api/shops/:id/approve`\|`suspend` (admin)
- [x] `server/src/controllers/paymentController.ts` — `POST /api/payments/seller-fee-checkout` → Stripe Checkout Session, $49 one-time, `metadata.type=seller_fee`
- [x] `server/src/routes/webhookRoutes.ts` — `POST /api/payments/webhook` (`express.raw`, mounted before `express.json()`), verifies signature, on `checkout.session.completed` + `type=seller_fee` sets `shop.feePaid=true`/`status=active` and bumps user role to `seller`
- [x] `server/src/config/stripe.ts` — Stripe client, `SELLER_FEE_AMOUNT_CENTS`
- [x] `server/src/utils/params.ts` — `getObjectIdParam` helper (Express 5 types `req.params[x]` as `string | string[]`, needed a typed guard)

**Client**
- [x] `/become-seller` — shop form → create shop → redirect to Stripe Checkout; if a shop already exists, shows status + "pay now" (handles pending/active/suspended)
- [x] `/become-seller/success` — polls `/shops/mine` briefly for the async webhook to land, then shows active state; `/become-seller/cancel`
- [x] `client/src/lib/api.ts` — `apiFetch` helper (credentials included, throws `ApiError`)
- [x] Minimal `/dashboard/seller` with `RequireRole("seller")` + shop status banner (full stats/charts dashboard is Phase 10)

**Verified live** with Stripe CLI (`stripe listen --api-key ... --forward-to localhost:5000/api/payments/webhook`) and a real test-card payment (4242...) through hosted Checkout: shop created → Checkout session → payment → webhook fired → shop flipped to `active` → user role flipped to `seller` → success page and seller dashboard both reflect it. Test account cleaned up after.

---

## Phase 4 — Products (CRUD + Approval) (DONE)

**Server**
- [x] Seeded `categories` (10: power tools, hand tools, grinding, drilling, cutting, measuring, fasteners, safety gear, welding, generators) via `npm run seed:categories`
- [x] `server/src/controllers/productController.ts` — create (requires active/fee-paid shop, status=pending), update (owner-only, resets to pending on edit), delete (owner or admin), get by id (public if approved, else owner/admin only via `attachUser`), list w/ search+category+shopId+price range+rating+condition+sort+pagination, admin list/approve/reject
- [x] `server/src/routes/productRoutes.ts` — wired with `requireAuth`/`requireRole`/`attachUser` per endpoint
- [x] `server/src/middleware/requireAuth.ts` — added `attachUser` (optional-auth variant that never 401s, needed for the public-but-owner-aware product details endpoint)
- [x] Indexes added in `ensureIndexes()` (`db.ts`): text index on `products.title`, `shops.shopName`, compound indexes on `(shopId,status)` and `(status,category,price)`, unique index on `shops.ownerUserId` (one shop per user, enforced at the DB level too)
- [x] `GET /api/categories`

**Client**
- [x] `/items/add` — `RequireRole("seller")`, zod-validated form, submits to `POST /api/products`
- [x] `/items/manage` — table with status badges, View/Delete
- [x] `/dashboard/admin` — pending shops queue (closes a Phase 3 gap — approve/suspend endpoints existed but had no UI) + pending products queue, both with approve/reject actions

**Bug caught + fixed:** `RequireRole` unmounted its children back to a "Loading…" screen on *every* `isPending` flicker from `useSession` (e.g. a background session refetch), not just the first load — wiping any in-progress form input. Fixed by only gating on first resolution (`hasResolvedOnce` ref), so later refetches don't blank already-rendered protected pages.

**Verify:** confirmed live — seller-added products are invisible on `/explore` while `pending`, and appear immediately after admin approval via `/dashboard/admin`.

---

## Phase 5 — Explore & Product Details (DONE)

**Client**
- [x] `client/src/components/ProductCard.tsx` / `ProductCardSkeleton.tsx`
- [x] `client/src/components/Providers.tsx` — wires `QueryClientProvider` into root layout (installed in Phase 0, never actually mounted until now)
- [x] `/explore` — search + category/condition/rating/price filters + sort + pagination, 4/2/1 responsive grid (Tailwind breakpoints; not re-verified visually at narrow widths this session, revisit in Phase 11 polish pass)
- [x] `client/src/lib/useProducts.ts` — TanStack Query hook, query key includes serialized filter string
- [x] `/products/[id]` — server component (public, no client JS needed to view), gallery, specs, shop mini-card, "Buy Now" present but disabled with an honest "checkout coming soon" label (real checkout is Phase 6, not faked)
- [x] `/shops/[id]` — server component, shop header + product grid, uses a proper `shopId` query param on `/api/products` rather than the fuzzy name search

**Verified live**: added 2 products across different categories/shops via the seller demo account, confirmed pending→hidden→admin-approved→visible-on-/explore end to end; category filter narrows correctly; search by shop name returns all of that shop's products; product details and shop pages both render real data correctly.

**Session note:** browser-automation click/keyboard delivery was unreliable for stretches this session (typed/clicked input sometimes landed on `<body>` instead of the target element, unrelated to any app code — confirmed by dispatching the same interactions as native DOM events instead, which worked every time and hit the exact same React handlers). Not a product bug; just noting in case it recurs.

---

## Phase 6 — Cart, Checkout, Orders (DONE)

**Server**
- [x] `server/src/models/order.ts` — extended `OrderItem` with denormalized `shopId`/`title`/`image` (snapshotted at checkout, so historical orders stay correct even if a product is later edited/deleted, and sellers can query orders by `items.shopId` without a join)
- [x] `server/src/controllers/orderController.ts` — `createOrderCheckout` validates each line (approved + enough stock) before creating the order (`status=pending`) and the Stripe Checkout Session (`metadata.type=order`), `listMyOrders`, `listOrdersAdmin`, `listOrdersByShop` (ownership-checked against `:shopId`)
- [x] `webhookController.ts` — `type=order` completion sets `order.status=paid` + `stripePaymentIntentId`, decrements `product.stock` per item; the update filters on `status:"pending"` so a redelivered Stripe webhook can't double-decrement stock
- [x] Indexes: `orders.buyerId`, `orders.items.shopId`

**Client**
- [x] `client/src/lib/cartStore.ts` — zustand + `persist` (localStorage), add/remove/updateQty clamped to stock
- [x] `/cart` — line items, qty steppers, subtotal, Checkout → Stripe redirect
- [x] `/checkout/success` (clears cart), `/checkout/cancel`
- [x] `/dashboard/buyer` — order history with status badges
- [x] `BuyNowButton` — replaces the Phase 5 disabled stub on `/products/[id]`, adds to cart and routes to `/cart`
- [x] Bonus: `/dashboard/seller` now also shows recent orders for that shop (endpoint existed, had no UI)

**Verified live** with a real Stripe test-card payment: Buy Now → cart → checkout → paid card → webhook fired → order `status: "paid"`, `stripePaymentIntentId` set, product stock decremented 40→39, order appears correctly in `/dashboard/buyer`.

---

## Phase 7 — Reviews & Ratings (DONE)

**Server**
- [x] `server/src/models/review.ts` — added `userName` snapshot (avoids a join for display)
- [x] `server/src/controllers/reviewController.ts` — `createReview` checks for a `paid`/`shipped`/`completed` order containing the product before allowing a review; upserts on `(productId, userId)` so a second submission updates rather than duplicates; recomputes `product.ratingAvg`/`ratingCount` via aggregation after every write
- [x] Unique index on `reviews.(productId, userId)`

**Client**
- [x] `ReviewSection` component on `/products/[id]` — star input, comment, list of existing reviews, form relabels to "Update your review" if the signed-in user already reviewed
- [x] ratingAvg/count already shown on `ProductCard` (Phase 5) and product details page

**Verified live**: buyer who purchased the wrench successfully reviewed it (5★, recomputed `ratingAvg: 5, ratingCount: 1` on the product); a different account that never purchased the drill got `403 "You must purchase this product before reviewing it"` when hitting the endpoint directly.

---

## Phase 8 — AI Feature A: Content Generator (Gemini) (DONE)

**Server**
- [x] `server/src/utils/gemini.ts` — plain `fetch` against the Gemini REST API (`gemini-flash-latest`), not the `@google/generative-ai` SDK — that package was already stale/pre-1.0 and REST is simpler for a single-call use case; uninstalled it
- [x] `server/src/controllers/aiController.ts` — `generateDescription` with a per-category tone map (10 categories) and per-length word-count guidance (short/medium/long), strict "raw JSON only" prompt + fence-stripping parser
- [x] `server/src/routes/aiRoutes.ts` — `POST /api/ai/generate-description` (seller only)

**Client**
- [x] AI Content Generator panel on `/items/add` (placed after Title/Category so both are set before generating) — keywords input, length select, Generate/Regenerate button, loading state, error display

**Verified live**: real Gemini calls across categories/lengths — grinding+medium produced power/precision-toned copy at the right length, hand-tools+short produced shorter durability-toned copy; Regenerate on the same inputs produced genuinely different phrasing ("Dominate the toughest..." → "Master tough cutting...").

---

## Phase 9 — AI Feature B: Smart Recommendation Engine (DONE)

**Server**
- [x] `server/src/models/aiInteraction.ts` — `view`/`purchase`/`search` interactions, logged from `productController.getProductById` (view), `productController.listProducts` (search, when a search term is present), and `webhookController` (purchase, on the same `order.status=paid` path that decrements stock)
- [x] `attachUser` (optional-auth, from Phase 5) added to `GET /api/products` and reused on `GET /api/products/:id` so logging knows who's browsing without requiring login
- [x] `server/src/utils/gemini.ts` — shared `rerankWithGemini(context, candidates, take)` helper: asks Gemini to pick+order the most relevant candidates, falls back to plain DB order on any parse/network failure
- [x] `getRelatedProducts` — same-category candidates (price-band fallback if fewer than 4), Gemini-reranked to top 4
- [x] `getRecommendedForUser` — category affinity from the user's last 50 view/purchase interactions (purchase weighted 3x), cold-start falls back to newest approved products; `?maxPrice=` query param powers the "cheaper alternatives" refine; Gemini-reranked to top 8
- [x] `GET /api/ai/related/:productId` (public — shown on the public product page), `GET /api/ai/recommendations` (auth required)
- [x] Refactored candidate queries to aggregate with the same shop-lookup stages as `productController` (exported `SHOP_LOOKUP_STAGES`) so related/recommended cards show shop name like everywhere else

**Client**
- [x] "Related Tools" section on `/products/[id]` (fills the Phase 5 stub), fetched server-side in parallel with the product itself
- [x] "Recommended for you" section on `/dashboard/buyer` with a "Cheaper alternatives" checkbox that recomputes `maxPrice` from the current results and re-queries

**Verified live**: seeded a 3rd product (hand-tools) so related/recommendation candidates had real same-category data. Related Tools on the wrench's page correctly surfaced the new pliers. A buyer who viewed+purchased hand-tools got hand-tools items ranked ahead of the power-tools drill in "Recommended for you"; toggling "Cheaper alternatives" correctly dropped the $89.99 drill and kept only the two sub-$19 items.

**Session note:** hit repeated Chrome-extension renderer stalls this session (`Script injection timed out`) unrelated to app code — confirmed via server logs that the page itself returned 200 in ~3s each time; verified the stuck view directly via `curl` against the rendered HTML, then a fresh tab recovered and gave full visual confirmation.

---

## Phase 10 — Dashboards (Admin / Seller / Buyer) (DONE)

**Server**
- [x] `server/src/controllers/statsController.ts` — `getAdminStats` (totals via `Promise.all`, signups-per-day for last 30, category split for approved products), `getShopStats` (sales-per-day via `$unwind` on `items` + match on `items.shopId`, ownership-checked)
- [x] `GET /api/admin/stats` (admin), `GET /api/shops/:id/stats` (owner or admin)

**Client**
- [x] `/dashboard/admin` — stat tiles (shops/products/orders/revenue), Recharts line (signups over time) + bar (category split), plus the existing pending-shops/pending-products queues and a new all-orders table
- [x] `/dashboard/seller` — Recharts sales-over-time line chart added above the existing shop status banner + recent orders
- [x] `/dashboard/buyer` — added a Profile section (name/email + sign-out); order history and recommendations already existed from Phases 6/9
- [x] `/dashboard` — role-based redirect page (`admin`/`seller`/`buyer`)

**Verified live**: admin stats matched real DB state exactly (1 shop, 3 approved products, 1 paid order → $14.50 revenue, category split 2 hand-tools/1 power-tools); both charts render correctly with real data; seller sales chart and all-orders table confirmed via API + one visual check.

---

## Phase 11 — Landing Page, Additional Pages, UI Polish (DONE)

**Client**
- [x] Theme tokens added to `globals.css` `@theme` (Tailwind v4 is CSS-config, no `tailwind.config.ts`): `brand-{50,100,600,700,800}` (steel blue), `accent-{50,100,600,700}` (safety orange), `charcoal`/`light-gray` (neutral) — existing pages already used blue-700/orange-600 consistently, so this formalizes rather than mass-renames
- [x] `Navbar` — sticky, role-aware (buyer sees Cart, seller sees Add Product, everyone logged-in sees Dashboard/Logout), mobile hamburger menu (`md:hidden`/`md:flex`)
- [x] `Footer` — About blurb, quick links, contact info, social icons linking to real platform homepages (facebook.com/x.com/instagram.com/linkedin.com — generic "follow us", not claiming a specific account, per discussion since ToolBazaar has no real accounts)
- [x] `/` rebuilt from the create-next-app boilerplate — Hero (60–70vh, functional search + Explore/Become-a-Seller CTAs) + 8 real-data-driven sections: Featured Categories, Trending Products, Featured Shops, How It Works, Platform Stats, Become-a-Seller CTA, FAQ, Newsletter (Testimonials deliberately skipped — assignment's section list is explicitly "just examples", and fabricated quotes were the one section that couldn't be backed by real data)
- [x] New server endpoints backing the landing page: `GET /api/stats/public` (shops/products/orders/users, no sensitive revenue data), `POST /api/contact` (stored in `contactMessages`), `POST /api/newsletter` (upserted into `newsletterSubscribers`)
- [x] `/about`, `/contact` (working form, not static-only)
- [x] `/explore` now reads initial `?search=`/`?category=` from the URL so Featured Categories and Hero search actually link somewhere real

**Verified live**: full landing page scroll-through — hero, categories, trending products (real 3 products, correctly rating-sorted), featured shops, how-it-works, platform stats (matched real DB counts exactly: 1/3/1/3), CTA, FAQ, newsletter all render with real data; newsletter signup and contact form both confirmed persisted to MongoDB via direct DB check.

**Not fully verified:** narrow-viewport responsive layout — the `resize_window` tool didn't actually change `window.innerWidth` in this session (confirmed via `matchMedia` check), so mobile/tablet breakpoints couldn't be screenshotted. The Navbar's `md:hidden`/`md:flex` split and the grids' `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` pattern (used consistently since Phase 5) are the standard Tailwind responsive approach, but worth a manual check in a real browser at some point.

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

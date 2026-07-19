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
- [x] Create Gemini API key (Google AI Studio), set `GEMINI_API_KEY` — ⚠️ verify format is `AIzaSy...`, current value doesn't match, re-check aistudio.google.com/apikey
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

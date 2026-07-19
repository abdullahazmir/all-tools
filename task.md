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

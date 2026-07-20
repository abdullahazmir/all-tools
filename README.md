<div align="center">

<img src="https://i.ibb.co/RTcpyHF3/toolbazaar-hero.png" alt="ToolBazaar — tools from real shops, delivered to your door" width="100%" />

# 🔧 ToolBazaar

**A multi-vendor marketplace for hand & machine tools — built full-stack, shipped to production, and powered by real AI.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-all--tools--lilac.vercel.app-4F46E5?style=for-the-badge&logo=vercel&logoColor=white)](https://all-tools-lilac.vercel.app)
[![API](https://img.shields.io/badge/API-toolbazaar--api.onrender.com-2E7D32?style=for-the-badge&logo=render&logoColor=white)](https://toolbazaar-api.onrender.com/api/health)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)

</div>

---

## What is this?

ToolBazaar is a working two-sided marketplace: local hardware & machine-tool shops register, pay a one-time listing fee, and sell to buyers who search, filter, review, and check out with real Stripe payments. It's built the way a production app is built — role-based auth, admin moderation queues, webhook-driven payment state, and two genuinely useful AI features baked into the core flows rather than bolted on as a demo.

**Everything below is live, not a mockup** — click through the demo, log in with any of the three roles, and add something to a real Stripe test-mode cart.

## ✨ Highlights

**Marketplace core**
- Multi-vendor shops with admin-approved product listings (pending → approved/rejected workflow)
- Search by product *or* shop name, filter by category/price/rating/condition, sort, paginate
- Cart, Stripe Checkout, order history, and purchase-gated reviews & ratings
- Role-based dashboards (admin / seller / buyer) with Recharts analytics — signups over time, category split, sales-per-day, revenue totals

**🤖 AI, actually integrated — not a gimmick**
- **AI Content Generator** — sellers type a title, category, and a few keywords; Gemini drafts a short + full product description with a category-aware tone (power tools read differently than safety gear), adjustable length, and one-click regenerate.
- **Smart Recommendation Engine** — "Related Tools" on every product page (same-category candidates, Gemini-reranked by relevance) and a personalized "Recommended for you" on the buyer dashboard, built from real view/purchase interaction logs with category-affinity scoring and a "cheaper alternatives" refinement filter.

**Auth & payments done right**
- BetterAuth: email/password + Google OAuth, server-enforced roles (buyers can't self-promote to seller/admin)
- Stripe Checkout Sessions for both the seller's $49 registration fee and every product order, reconciled via webhooks (idempotent — a redelivered webhook can't double-charge stock)

**Real deployment, real problems solved**
- Client (Vercel) and API (Render) are genuinely different origins — solved with a Next.js rewrite proxy for same-origin cookies, plus a separate absolute-URL path for server-side data fetching
- MongoDB Atlas, native `mongodb` driver (no ODM), typed collection accessors throughout

## 📸 Screenshots

<div align="center">
<img src="https://i.ibb.co/9kLtNCw1/toolbazaar-explore-v2.png" alt="Explore page — search, filters, sort, pagination" width="90%" />
<p><em>Explore — search by product or shop name, filter by category/price/rating/condition</em></p>

<img src="https://i.ibb.co/d4HB5Lm8/toolbazaar-product-v3.png" alt="Product details page with AI-powered Related Tools" width="90%" />
<p><em>Product details — the "Related Tools" row is the live AI recommendation engine, not static data. Product photos are real: sourced per-exact-product where a genuine match exists (Klein Tools pliers here), category-accurate otherwise.</em></p>
</div>

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · TanStack Query · Recharts · Zustand |
| **Backend** | Node.js · Express 5 · TypeScript · MongoDB (native driver, no ODM) |
| **Auth** | BetterAuth — email/password + Google OAuth, server-enforced roles |
| **Payments** | Stripe Checkout Sessions + webhooks |
| **AI** | Google Gemini (`gemini-flash-latest`) via REST — content generation + recommendation reranking |
| **Deployment** | Vercel (client) · Render (API) · MongoDB Atlas (database) |

## 🚀 Try it live

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.toolbazaar.dev` | `Demo1234!` |
| Seller | `seller@demo.toolbazaar.dev` | `Demo1234!` |
| Buyer | `buyer@demo.toolbazaar.dev` | `Demo1234!` |

Or just hit the one-click demo-login buttons on the [login page](https://all-tools-lilac.vercel.app/login) — no typing required. Every role has its own dashboard with real data behind it.

> Backend is on Render's free tier, so the very first request after a period of inactivity can take a few seconds to cold-start. It's fast after that.

## 🏗️ Architecture notes

A couple of things worth calling out for anyone reading the code:

- **Cross-origin auth, solved properly.** The client and API are deployed on different domains. Rather than relying on `SameSite=None` cookies alone (which breaks server-side route protection), API calls are proxied same-origin through a Next.js rewrite, so session cookies belong to the client's own domain — including through the Google OAuth redirect.
- **Idempotent payment webhooks.** Both the seller registration fee and product orders share one Stripe webhook, disambiguated by `metadata.type`. Stock decrements are conditioned on the order still being `pending`, so a redelivered webhook event can't double-charge inventory.
- **AI with a fallback, not a dependency.** If Gemini's rerank call fails or times out, both AI surfaces fall back to sane default ordering (same-category/newest) instead of breaking the page.
- **Product photos, sourced honestly.** Every product image is real (Wikimedia Commons, openly licensed) — matched to the exact product where a genuine real-world match exists (e.g. an actual Klein Tools linesman pliers photo for the Klein Tools listing), and to an accurate category photo otherwise (a real angle grinder for grinding tools, a real bolt for fasteners). No product shows an unrelated stock photo.

## 🛠️ Local setup

```bash
git clone https://github.com/abdullahazmir/all-tools.git
cd all-tools

# Backend
cd server
npm install
cp .env.example .env   # fill in MongoDB URI, BetterAuth secret, Google OAuth, Stripe keys, Gemini key
npm run seed              # creates admin/seller/buyer demo accounts
npm run seed:categories   # seeds the 10 tool categories
npm run seed:bulk-products # seeds 50+ sample products across multiple sellers, with images
npm run dev

# Frontend (new terminal)
cd ../client
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, Google client ID, Stripe publishable key
npm run dev
```

Client runs on `localhost:3000`, API on `localhost:5000`.

## 📁 Project structure

```
all-tools/
├── client/                  Next.js 16 App Router frontend
│   └── src/app/             pages: /, /explore, /products/[id], /shops/[id],
│                             /dashboard/{admin,seller,buyer}, /items/{add,manage}, ...
├── server/                  Express 5 + TypeScript API
│   ├── src/controllers/     shop, product, order, review, payment, ai, stats
│   ├── src/models/          typed MongoDB collection accessors
│   └── src/scripts/         seed / seed:categories / seed:bulk-products
├── plan.md                  original architecture & feature plan
└── task.md                  phase-by-phase build log
```

## 🗺️ Possible next steps

- AI chat assistant for buyer navigation/support
- Wishlist and saved-search alerts
- Multi-image drag-and-drop upload for sellers (currently URL-based)

---

<div align="center">

Built by **[@abdullahazmir](https://github.com/abdullahazmir)** — open to freelance & full-time opportunities.

⭐ If this caught your eye, a star helps more than you'd think.

</div>

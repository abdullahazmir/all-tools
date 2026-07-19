"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;

  async function handleLogout() {
    await authClient.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const linkClass =
    "block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700 dark:text-brand-100">
          🔧 ToolBazaar
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link href="/" className={linkClass}>Home</Link>
          <Link href="/explore" className={linkClass}>Explore</Link>
          <Link href="/about" className={linkClass}>About</Link>
          <Link href="/contact" className={linkClass}>Contact</Link>

          {session ? (
            <>
              <Link href="/dashboard" className={linkClass}>Dashboard</Link>
              {role === "buyer" && <Link href="/cart" className={linkClass}>Cart</Link>}
              {role === "seller" && <Link href="/items/add" className={linkClass}>Add Product</Link>}
              <button onClick={handleLogout} className={linkClass}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>Login</Link>
              <Link
                href="/register"
                className="ml-1 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-2 text-neutral-700 md:hidden dark:text-neutral-200"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-neutral-200 px-4 py-3 md:hidden dark:border-neutral-800">
          <div className="flex flex-col gap-1">
            <Link href="/" className={linkClass} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/explore" className={linkClass} onClick={() => setMenuOpen(false)}>Explore</Link>
            <Link href="/about" className={linkClass} onClick={() => setMenuOpen(false)}>About</Link>
            <Link href="/contact" className={linkClass} onClick={() => setMenuOpen(false)}>Contact</Link>
            {session ? (
              <>
                <Link href="/dashboard" className={linkClass} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                {role === "buyer" && (
                  <Link href="/cart" className={linkClass} onClick={() => setMenuOpen(false)}>Cart</Link>
                )}
                {role === "seller" && (
                  <Link href="/items/add" className={linkClass} onClick={() => setMenuOpen(false)}>Add Product</Link>
                )}
                <button onClick={handleLogout} className={`${linkClass} text-left`}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass} onClick={() => setMenuOpen(false)}>Login</Link>
                <Link href="/register" className={linkClass} onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

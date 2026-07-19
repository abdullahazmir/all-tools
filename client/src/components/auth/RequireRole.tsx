"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

type Role = "admin" | "seller" | "buyer";

export function RequireRole({
  role,
  children,
}: {
  role: Role | Role[];
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const allowedRolesRef = useRef(Array.isArray(role) ? role : [role]);
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);

  useEffect(() => {
    if (isPending) return;
    setHasResolvedOnce(true);
    if (!session) {
      router.replace("/login");
      return;
    }
    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !allowedRolesRef.current.includes(userRole)) {
      router.replace("/");
    }
  }, [isPending, session, router]);

  // Only gate on the *first* resolution — a later refetch (e.g. on tab focus)
  // must not unmount already-rendered children and wipe in-progress form state.
  if (isPending && !hasResolvedOnce) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  const userRole = (session?.user as { role?: Role } | undefined)?.role;
  if (!hasResolvedOnce || !session || !userRole || !allowedRolesRef.current.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}

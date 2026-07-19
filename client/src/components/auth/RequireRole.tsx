"use client";

import { useEffect } from "react";
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
  const allowedRoles = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    const userRole = (session.user as { role?: Role }).role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, session]);

  if (isPending) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  const userRole = (session?.user as { role?: Role } | undefined)?.role;
  if (!session || !userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function DashboardRedirectPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login?redirect=/dashboard");
      return;
    }
    const role = (session.user as { role?: string }).role;
    router.replace(role === "admin" ? "/dashboard/admin" : role === "seller" ? "/dashboard/seller" : "/dashboard/buyer");
  }, [isPending, session, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-500">
      Loading…
    </div>
  );
}

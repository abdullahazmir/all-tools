import Link from "next/link";

export default function BecomeSellerCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Payment cancelled
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          No charge was made. You can try again whenever you&apos;re ready.
        </p>
        <Link
          href="/become-seller"
          className="mt-6 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Back to registration
        </Link>
      </div>
    </div>
  );
}

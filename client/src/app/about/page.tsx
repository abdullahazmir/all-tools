export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">About ToolBazaar</h1>
      <p className="mt-4 text-neutral-600 dark:text-neutral-300">
        ToolBazaar connects local hand and machine tool shops with buyers who need them. Instead
        of walking into one shop hoping they have the right drill bit or angle grinder, buyers can
        search across many verified shops in one place, compare prices, and get it delivered.
      </p>
      <p className="mt-4 text-neutral-600 dark:text-neutral-300">
        For shop owners, ToolBazaar is a way to reach buyers beyond foot traffic. A one-time
        registration fee activates a shop, and every product listing goes through a quick admin
        review before it's visible to buyers — keeping the catalog accurate and trustworthy.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        What makes it different
      </h2>
      <ul className="mt-4 space-y-3 text-neutral-600 dark:text-neutral-300">
        <li>
          <strong className="text-neutral-900 dark:text-neutral-100">AI-assisted listings</strong> —
          sellers can generate polished product descriptions from a title, category, and a few
          keywords instead of writing hundreds of listings by hand.
        </li>
        <li>
          <strong className="text-neutral-900 dark:text-neutral-100">Smart recommendations</strong> —
          buyers see related tools and personalized suggestions based on what they've viewed and
          bought.
        </li>
        <li>
          <strong className="text-neutral-900 dark:text-neutral-100">Verified reviews</strong> —
          only buyers who actually purchased a product can review it.
        </li>
      </ul>
    </div>
  );
}

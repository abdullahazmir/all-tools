import { connectDB } from "../config/db";
import { getAuth } from "../auth";
import { usersCollection } from "../models/user";

const DEMO_PASSWORD = "Demo1234!";

const DEMO_ACCOUNTS = [
  { name: "Demo Admin", email: "admin@demo.toolbazaar.dev", role: "admin" as const },
  { name: "Demo Seller", email: "seller@demo.toolbazaar.dev", role: "seller" as const },
  { name: "Demo Buyer", email: "buyer@demo.toolbazaar.dev", role: "buyer" as const },
];

async function seed() {
  await connectDB();
  const auth = await getAuth();
  const users = usersCollection();

  for (const account of DEMO_ACCOUNTS) {
    const existing = await users.findOne({ email: account.email });
    if (existing) {
      if (existing.role !== account.role) {
        await users.updateOne({ email: account.email }, { $set: { role: account.role } });
      }
      console.log(`Already exists, role synced: ${account.email} (${account.role})`);
      continue;
    }

    await auth.api.signUpEmail({
      body: {
        name: account.name,
        email: account.email,
        password: DEMO_PASSWORD,
      },
    });

    if (account.role !== "buyer") {
      await users.updateOne({ email: account.email }, { $set: { role: account.role } });
    }

    console.log(`Created: ${account.email} (${account.role})`);
  }

  console.log(`\nDemo password for all accounts: ${DEMO_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

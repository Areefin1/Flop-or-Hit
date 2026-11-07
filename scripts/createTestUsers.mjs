
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.test.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !adminKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const numberOfUsers = Number(process.argv[2] ?? 2);

if (
  !Number.isInteger(numberOfUsers) ||
  numberOfUsers < 1 ||
  numberOfUsers > 20
) {
  throw new Error("Enter a number between 1 and 20.");
}

const testRun = "reaction-benchmark-20261106";

for (let i = 3; i <= numberOfUsers; i++) {
  const username = `perf_user_${String(i).padStart(3, "0")}`;
  const email = `${username}@example.com`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: `Performance Test User ${i}`,
    },
  });

  if (error) {
    console.error(`Failed: ${username} — ${error.message}`);
    continue;
  }

  console.log(`Created: ${username} (${data.user.id})`);
}

console.log(`Finished creating test users for ${testRun}.`);

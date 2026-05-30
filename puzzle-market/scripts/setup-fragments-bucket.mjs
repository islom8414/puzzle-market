import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local"
  );
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  console.error(
    "Supabase Dashboard → Settings → API → service_role → copy secret key"
  );
  process.exit(1);
}

const admin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const { data: buckets, error: listError } =
  await admin.storage.listBuckets();

if (listError) {
  console.error(
    "Could not list buckets:",
    listError.message
  );
  process.exit(1);
}

const exists = buckets?.some(
  (bucket) => bucket.name === "fragments"
);

if (!exists) {
  const { error: createError } =
    await admin.storage.createBucket(
      "fragments",
      {
        public: true,
        fileSizeLimit: 52_428_800,
      }
    );

  if (createError) {
    console.error(
      "Could not create fragments bucket:",
      createError.message
    );
    process.exit(1);
  }

  console.log(
    "Created public bucket: fragments"
  );
} else {
  const { error: updateError } =
    await admin.storage.updateBucket(
      "fragments",
      { public: true }
    );

  if (updateError) {
    console.warn(
      "Bucket exists; could not set public:",
      updateError.message
    );
  } else {
    console.log(
      "Bucket fragments is ready (public read)"
    );
  }
}

console.log("Done. You can upload puzzles at /create");

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rate-limit";

// TODO: Image resizing and EXIF stripping require native modules (e.g. sharp) which
// are not available in the Vercel Edge runtime. Implement these transformations in a
// Supabase Edge Function (or a Vercel serverless function with a custom layer) and
// invoke it before storing the file. For now, files are stored as-is.

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = "pet-images";

async function handleUpload(request: NextRequest): Promise<NextResponse> {
  // Authenticate via JWT (cookie-based Supabase session)
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const petId = formData.get("pet_id");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }
  if (!petId || typeof petId !== "string") {
    return NextResponse.json(
      { error: "Missing pet_id field" },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: "Unsupported media type. Allowed: image/jpeg, image/png, image/webp",
      },
      { status: 415 }
    );
  }

  // Validate file size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB" },
      { status: 413 }
    );
  }

  const storagePath = `pets/${user.id}/${petId}/${Date.now()}.jpg`;
  const arrayBuffer = await file.arrayBuffer();

  // Use service client to bypass RLS for storage uploads
  const serviceClient = createServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed", details: uploadError.message },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = serviceClient.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({ url: publicUrl, path: storagePath });
}

export const POST = withRateLimit(handleUpload, {
  key: (req) => {
    // Prefer forwarded IP; fall back to a generic key
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    return `upload:${ip}`;
  },
  limit: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
});

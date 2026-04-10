import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add CLERK_SIGNING_SECRET to your environment variables"
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error: Missing Svix headers", { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new NextResponse("Error: Verification error", { status: 400 });
  }

  // Handle user events
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const supabase = createSupabaseAdminClient();

    const email = email_addresses?.[0]?.email_address;
    const fullName = `${first_name || ""} ${last_name || ""}`.trim();

    // Upsert profile
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          clerk_id: id,
          email: email || "",
          full_name: fullName || "User",
          role: "sales", // Default role
          avatar_url: image_url || null,
        },
        {
          onConflict: "clerk_id",
        }
      );

    if (error) {
      console.error("Error upserting profile:", error);
      return new NextResponse("Error creating profile", { status: 500 });
    }

    console.log(`Profile synced for user: ${id}`);
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    const supabase = createSupabaseAdminClient();

    // Delete profile
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("clerk_id", id);

    if (error) {
      console.error("Error deleting profile:", error);
    } else {
      console.log(`Profile deleted for user: ${id}`);
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}

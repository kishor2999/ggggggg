import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client"; // Removed UserRole import

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env"
    );
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const userId = evt.data.id;
    const email = evt.data.email_addresses[0].email_address;
    const name =
      `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim();
    const profileImage = evt.data.image_url;
    const phone =
      evt.data.phone_numbers && evt.data.phone_numbers.length > 0
        ? evt.data.phone_numbers[0].phone_number
        : null;
    let role = "CUSTOMER"; // Default role as a string

    if (!userId) {
      return new Response("Error: User ID not found in webhook payload", {
        status: 400,
      });
    }

    try {
      const client = await clerkClient();

      if (eventType === "user.created") {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: { role: "customer" },
        });
        
        await prisma.user.create({
          data: {
            clerkId: userId,
            name: name,
            email: email,
            profileImage: profileImage,
            role: role,
          },
        });

              } else if (eventType === "user.updated") {
        const clerkUser = await client.users.getUser(userId);
        if (clerkUser.publicMetadata && clerkUser.publicMetadata.role) {
          role = clerkUser.publicMetadata.role as string; // Directly use the string value
        }

        await prisma.user.update({
          where: { clerkId: userId },
          data: {
            name: name,
            email: email,
            profileImage: profileImage,
            role: role,
          },
        });

              }
    } catch (error) {
      console.error("Error assigning role or creating user:", error);
      return new Response("Error: Could not assign role or create user", {
        status: 500,
      });
    }
  }

  return new Response(
    "Webhook received and role assigned/user created if user created",
    { status: 200 }
  );
}

/**
 * Server-only Brevo helper. Pushes a signup (name, email, phone, birthday)
 * into Brevo as a contact on the configured list, so the birthday/discount
 * automations set up in Brevo can pick them up. BREVO_API_KEY never
 * touches the browser - only called from API routes.
 */
export async function addBrevoContact(params: {
  email: string;
  name: string;
  phone: string;
  birthday?: string; // MM-DD - no year is ever collected from customers
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;

  if (!apiKey || !listId) {
    console.warn("Brevo credentials not configured - skipping contact sync");
    return { synced: false };
  }

  const [firstName, ...rest] = params.name.trim().split(" ");
  const lastName = rest.join(" ");

  // Brevo's SMS attribute expects an international format - Nigerian
  // numbers are usually typed starting with 0 (e.g. 080...), so swap
  // that leading 0 for the +234 country code.
  const smsNumber = params.phone.trim().startsWith("0")
    ? `+234${params.phone.trim().slice(1)}`
    : params.phone.trim();

  // Brevo's BIRTHDAY attribute needs a full date, but we never collect a
  // birth year - 2000 (a leap year, so Feb 29 works too) is just a
  // placeholder to satisfy the format. Brevo's birthday automation only
  // matches month/day against today, so the placeholder year is never
  // seen or used anywhere.
  const brevoBirthday = params.birthday ? `2000-${params.birthday}` : undefined;

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      listIds: [Number(listId)],
      updateEnabled: true,
      attributes: {
        FIRSTNAME: firstName || "",
        LASTNAME: lastName || "",
        SMS: smsNumber,
        ...(brevoBirthday ? { BIRTHDAY: brevoBirthday } : {}),
      },
    }),
  });

  // Brevo returns 204 for update, 201 for create - both are success.
  if (res.status !== 201 && res.status !== 204) {
    const body = await res.text();
    console.error("Brevo contact sync failed:", res.status, body);
    return { synced: false };
  }

  return { synced: true };
}

/**
 * Removes a contact from Brevo entirely - used when deleting a signup from
 * the admin dashboard (e.g. test/junk entries), so a stray contact doesn't
 * linger in the real marketing list or get caught by the birthday
 * automation. 404 (already gone) is treated as success.
 */
export async function deleteBrevoContact(email: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: { "api-key": apiKey, Accept: "application/json" },
  });

  if (res.status !== 204 && res.status !== 404) {
    const body = await res.text();
    console.error("Brevo contact delete failed:", res.status, body);
  }
}

/**
 * Flags a contact as having redeemed their birthday discount this year, so
 * the "day of" birthday workflow in Brevo can branch on it (e.g. skip the
 * discount reminder and just send a celebration message instead). This
 * doesn't reset itself automatically for next year's cycle - if that
 * matters, the workflow's condition step should be paired with the
 * calendar-based checks already enforced server-side in src/lib/discount.ts.
 */
export async function markBrevoBirthdayDiscountUsed(email: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ attributes: { BIRTHDAY_DISCOUNT_USED: true } }),
  });

  if (res.status !== 204) {
    const body = await res.text();
    console.error("Brevo birthday-discount-used sync failed:", res.status, body);
  }
}

/**
 * Sends Faith a heads-up email for things she'd otherwise have to keep
 * checking the admin dashboard for: new wholesale inquiries, signups, and
 * paid orders. Uses Brevo's transactional email API (separate from the
 * marketing contact list). Failures are logged, not thrown - a missed
 * notification shouldn't ever block a real signup/order/inquiry from
 * completing.
 */
export async function sendAdminNotification(subject: string, htmlContent: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const notifyEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !notifyEmail) {
    console.warn("Brevo/ADMIN_NOTIFICATION_EMAIL not configured - skipping admin notification");
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Biggystone Website", email: notifyEmail },
      to: [{ email: notifyEmail }],
      subject,
      htmlContent,
    }),
  });

  if (res.status !== 201) {
    const body = await res.text();
    console.error("Admin notification email failed:", res.status, body);
  }
}

/**
 * Emails the customer directly (not Faith) - used so a gift voucher code
 * isn't lost if they close the confirmation page without noting it down.
 * Best-effort: the code is already shown on screen when this is called, so
 * a failed email here shouldn't block anything.
 */
async function sendCustomerEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn("Brevo/ADMIN_NOTIFICATION_EMAIL not configured - skipping customer email");
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Biggystone Fashion Atelier", email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (res.status !== 201) {
    const body = await res.text();
    console.error("Customer email failed:", res.status, body);
  }
}

/**
 * Sends an admin password-reset link. Called from
 * /api/admin/forgot-password, which always responds with the same generic
 * message regardless of whether this actually sends - so a failure here
 * (e.g. Brevo misconfigured) is logged for manual follow-up, not surfaced
 * to whoever requested the reset.
 */
export async function sendAdminPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendCustomerEmail(
    email,
    "Reset your Biggystone admin password",
    `<p>A password reset was requested for this admin account.</p>
     <p><a href="${resetUrl}">Click here to set a new password</a></p>
     <p>This link expires in 1 hour and can only be used once.</p>
     <p>If you didn't request this, you can safely ignore this email - your password won't change.</p>`
  );
}

const LOGO_URL =
  "https://vf7pcobtrhakoohu.public.blob.vercel-storage.com/products/d668a454-d736-4695-a156-89a2b7aa42ff.png";

/**
 * Sent the moment someone signs up (see /api/signup), instead of relying on
 * a Brevo dashboard automation - a code-triggered email like this can't
 * silently break the way a manually-built workflow step can, and it fires
 * immediately rather than waiting on Brevo's automation delay.
 */
export async function sendWelcomeEmail(params: { email: string; name: string }): Promise<void> {
  const firstName = params.name.trim().split(" ")[0] || params.name;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biggystonefashion.com";

  await sendCustomerEmail(
    params.email,
    "Welcome to Biggystone Fashion Atelier 🎉",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
       <img src="${LOGO_URL}" alt="Biggystone Fashion Atelier" style="height:48px;margin-bottom:16px;">
       <p>Hi ${firstName},</p>
       <p>Welcome to Biggystone Fashion Atelier — thank you for joining us. We started
       in 2019 on one idea: you shouldn't have to break the bank to look good, and
       we've carried that with us as we've grown from a small campus favorite into
       an atelier serving customers across Lagos and beyond.</p>
       <p>Here's what you get shopping with us:</p>
       <ul>
         <li><strong>Real affordability</strong> — pieces from ₦1,000, most under ₦5,000</li>
         <li><strong>New drops every month</strong> — picked to match what's actually trending</li>
         <li><strong>First access</strong> — you'll hear about new pieces before anyone else, as someone on this list</li>
         <li><strong>Fast delivery</strong> — same-day pickup for Unilag, nationwide delivery elsewhere with WhatsApp updates the whole way</li>
         <li><strong>A birthday discount</strong> — code <strong>BSTONEBDAY</strong> for 10% off, valid during your birthday month</li>
         <li><strong>Loyalty rewards</strong> — every 5th qualifying order unlocks a surprise gift, on us</li>
         <li><strong>A September to remember</strong> — a discount and free delivery on qualifying orders, every September, in honor of the person Biggystone is named after</li>
         <li><strong>Buying in bulk?</strong> — pre-order wholesale pricing if you're reselling</li>
         <li><strong>Real support</strong> — message us on WhatsApp and get a reply from a real person, not a bot</li>
       </ul>
       <p><a href="${siteUrl}/shop" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#111;color:#f5c453;text-decoration:none;border-radius:999px;">Shop now</a></p>
       <p style="margin-top:24px;">With love,<br>Faith, Founder — Biggystone Fashion Atelier</p>
     </div>`
  );
}

/**
 * Sent 7 days after a paid order (see /api/cron/review-requests) - long
 * enough that most orders have actually been picked up/delivered by then,
 * so the ask is about the product, not just the checkout experience.
 * Silently skipped if GOOGLE_REVIEW_LINK isn't set yet.
 */
// Same number/style as the site-wide WhatsApp button (src/components/WhatsAppButton.tsx).
const WHATSAPP_NUMBER = "2348148263705";

export async function sendReviewRequestEmail(params: { email: string; name: string }): Promise<void> {
  const reviewLink = process.env.GOOGLE_REVIEW_LINK;
  if (!reviewLink) {
    console.warn("GOOGLE_REVIEW_LINK not configured - skipping review request email");
    return;
  }

  const firstName = params.name.trim().split(" ")[0] || params.name;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi Biggystone, I have a concern about my recent order"
  )}`;

  await sendCustomerEmail(
    params.email,
    "How's your Biggystone piece? 💛",
    `<p>Hi ${firstName},</p>
     <p>Hope you're loving what you got from Biggystone Fashion Atelier! If you have
     a minute, a quick Google review would mean a lot to us as a growing atelier -
     it genuinely helps other people find us.</p>
     <p><a href="${reviewLink}" style="display:inline-block;padding:10px 20px;background:#111;color:#f5c453;text-decoration:none;border-radius:999px;">Leave a review</a></p>
     <p style="margin-top:20px;">Not quite happy with something instead? Please tell us directly
     — we'd rather make it right than have you leave unhappy.</p>
     <p><a href="${whatsappHref}" style="display:inline-block;padding:10px 20px;background:#25D366;color:#fff;text-decoration:none;border-radius:999px;">Chat with us on WhatsApp</a></p>
     <p style="margin-top:24px;">With love,<br>Faith, Founder — Biggystone Fashion Atelier</p>`
  );
}

export async function sendGiftVoucherEmail(params: {
  email: string;
  customerName: string;
  code: string;
  giftName: string;
  type: "fixed_discount" | "free_delivery";
  amount: number | null;
}): Promise<void> {
  const rewardLine =
    params.type === "fixed_discount"
      ? `₦${(params.amount ?? 0).toLocaleString()} off your next order`
      : "free delivery on your next order";

  await sendCustomerEmail(
    params.email,
    `Your Biggystone gift code — ${params.giftName}`,
    `<p>Hi ${params.customerName},</p>
     <p>Thank you for being a loyal customer! You picked <strong>${params.giftName}</strong> —
     that's ${rewardLine}.</p>
     <p>Your one-time code: <strong style="font-size:18px;letter-spacing:1px;">${params.code}</strong></p>
     <p>Enter this code at checkout (discount code field) whenever you're ready to use it.</p>
     <p>With love,<br>Faith, Founder — Biggystone Fashion Atelier</p>`
  );
}

export async function notifyOrderPaid(order: {
  customer_name: string;
  email: string;
  phone: string;
  total: number;
  order_type: "retail" | "wholesale";
  order_items: { product_name: string; quantity: number; unit_price: number }[];
}): Promise<void> {
  const itemsList = order.order_items
    .map((i) => `${i.quantity} × ${i.product_name} — ₦${(i.unit_price * i.quantity).toLocaleString()}`)
    .join("<br>");

  await sendAdminNotification(
    `New paid order — ₦${order.total.toLocaleString()} (${order.customer_name})`,
    `<p><strong>${order.customer_name}</strong> just paid for a ${order.order_type} order.</p>
     <p>Email: ${order.email}<br>Phone: ${order.phone}</p>
     <p>${itemsList}</p>
     <p><strong>Total: ₦${order.total.toLocaleString()}</strong></p>
     <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/orders">View in admin dashboard</a></p>`
  );
}

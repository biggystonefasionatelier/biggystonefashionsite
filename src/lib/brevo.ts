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

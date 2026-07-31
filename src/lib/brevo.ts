/**
 * Server-only Brevo helper. Pushes a signup (name, email, birthday) into
 * Brevo as a contact on the configured list, so the birthday/discount
 * automations set up in Brevo can pick them up. BREVO_API_KEY never
 * touches the browser - only called from API routes.
 */
export async function addBrevoContact(params: {
  email: string;
  name: string;
  birthday?: string; // YYYY-MM-DD
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;

  if (!apiKey || !listId) {
    console.warn("Brevo credentials not configured - skipping contact sync");
    return { synced: false };
  }

  const [firstName, ...rest] = params.name.trim().split(" ");
  const lastName = rest.join(" ");

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
        ...(params.birthday ? { BIRTHDAY: params.birthday } : {}),
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

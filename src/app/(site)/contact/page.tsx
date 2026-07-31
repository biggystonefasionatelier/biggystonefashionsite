export const metadata = { title: "Contact | Biggystone Fashion Atelier" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Contact</h1>
      <div className="mt-6 space-y-2 text-neutral-700">
        <p><strong>Phone / WhatsApp:</strong> +234 814 826 3705</p>
        <p><strong>Email:</strong> biggystonefashionatelier@gmail.com</p>
        <p><strong>Address:</strong> 5, Ajileye Street, Ilaje Road, Bariga, Lagos, Nigeria</p>
        <p>
          <strong>Instagram:</strong>{" "}
          <a
            href="https://www.instagram.com/biggystonefashionatelier"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            @biggystonefashionatelier
          </a>
        </p>
      </div>
    </div>
  );
}

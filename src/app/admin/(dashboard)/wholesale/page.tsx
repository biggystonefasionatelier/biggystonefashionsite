"use client";

import { useEffect, useState } from "react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string | null;
  quantity_interested: string;
  message: string | null;
  created_at: string;
};

export default function AdminWholesalePage() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/wholesale-inquiries")
      .then((r) => r.json())
      .then((data) => setInquiries(data.inquiries ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Wholesale inquiries</h1>

      {!inquiries ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : inquiries.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No inquiries yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-xl border border-black/10 bg-white p-4">
              <p className="font-medium">
                {inq.name} {inq.business_name && `— ${inq.business_name}`}
              </p>
              <p className="text-xs text-neutral-500">
                {inq.email} · {inq.phone}
              </p>
              <p className="mt-2 text-sm">
                <strong>Quantity:</strong> {inq.quantity_interested}
              </p>
              {inq.message && <p className="mt-1 text-sm text-neutral-600">{inq.message}</p>}
              <p className="mt-2 text-xs text-neutral-400">
                {new Date(inq.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

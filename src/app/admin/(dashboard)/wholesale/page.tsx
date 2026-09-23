"use client";

import { useEffect, useState } from "react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string | null;
  interest_type?: "wholesale" | "pre_order";
  quantity_interested: string;
  message: string | null;
  created_at: string;
};

function interestLabel(type: Inquiry["interest_type"]): string {
  if (type === "pre_order") return "Pre-Order Wholesale";
  if (type === "wholesale") return "Wholesale (available pieces)";
  return "Not specified";
}

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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {inq.name} {inq.business_name && `— ${inq.business_name}`}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    inq.interest_type === "pre_order"
                      ? "bg-brand-gold-light text-neutral-800"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {interestLabel(inq.interest_type)}
                </span>
              </div>
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

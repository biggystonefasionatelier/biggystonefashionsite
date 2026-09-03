"use client";

import { useEffect, useState } from "react";

type Signup = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null; // MM-DD, no year
  brevo_synced: boolean;
  created_at: string;
  referral_code?: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatBirthday(birthday: string | null): string {
  if (!birthday) return "—";
  const [month, day] = birthday.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

function toCsv(signups: Signup[]): string {
  const header = "Name,Email,Phone,Birthday,Synced to Brevo,Joined\n";
  const rows = signups.map((s) =>
    [
      `"${s.name.replace(/"/g, '""')}"`,
      s.email,
      s.phone,
      s.birthday ?? "",
      s.brevo_synced ? "Yes" : "No",
      new Date(s.created_at).toISOString(),
    ].join(",")
  );
  return header + rows.join("\n");
}

export default function AdminSignupsPage() {
  const [signups, setSignups] = useState<Signup[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/signups")
      .then((r) => r.json())
      .then((data) => setSignups(data.signups ?? []));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}" from the list? This can't be undone.`)) return;
    setSignups((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    await fetch(`/api/admin/signups/${id}`, { method: "DELETE" });
  }

  function handleExport() {
    if (!signups || signups.length === 0) return;
    const csv = toCsv(signups);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biggystone-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Email/birthday list</h1>
        <button
          onClick={handleExport}
          disabled={!signups || signups.length === 0}
          className="rounded-full bg-brand-black px-4 py-2 text-sm text-brand-gold-light disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {!signups ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : signups.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No signups yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Birthday</th>
                <th className="px-4 py-3">Synced</th>
                <th className="px-4 py-3">Referral code</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.phone}</td>
                  <td className="px-4 py-3">{formatBirthday(s.birthday)}</td>
                  <td className="px-4 py-3">{s.brevo_synced ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.referral_code ?? "—"}</td>
                  <td className="px-4 py-3">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-xs text-red-600 underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

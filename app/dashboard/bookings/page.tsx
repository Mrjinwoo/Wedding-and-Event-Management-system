"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
  id: string; event_type: string; event_date: string; guest_count: number;
  total_price: number; status: string; notes: string; created_at: string;
  venues: { name: string; location: string; image_url: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { loadBookings(); }, [filter]);

  async function loadBookings() {
    setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/bookings${params}`);
    const json = await res.json();
    setBookings(json.data ?? []);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(id); setError("");
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); }
    else { loadBookings(); }
    setCancelling(null);
  }

  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      <div className="bg-[#9B2C4A] py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard" className="text-white/70 text-sm hover:text-white">← Dashboard</Link>
          <h1 className="text-white font-display text-2xl font-bold mt-1">My Bookings</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {["", "pending", "confirmed", "cancelled", "completed"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === s ? "bg-[#9B2C4A] text-white border-[#9B2C4A]" : "bg-white text-gray-600 border-gray-200 hover:border-[#9B2C4A]"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">No bookings found.</p>
            <Link href="/venue" className="inline-block bg-[#9B2C4A] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#7A1F38] transition-colors">
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-display font-semibold text-[#1a1a1a]">{b.event_type}</p>
                      <p className="text-xs text-gray-400">{b.venues?.name} · {b.venues?.location}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                    <span>📅 {new Date(b.event_date).toLocaleDateString()}</span>
                    <span>👥 {b.guest_count} guests</span>
                    <span>💰 ₱{Number(b.total_price).toLocaleString()}</span>
                    <span>📌 {new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  {b.notes && <p className="text-xs text-gray-400 italic mb-3">{b.notes}</p>}
                  {b.status === "pending" && (
                    <button onClick={() => cancelBooking(b.id)} disabled={cancelling === b.id}
                      className="w-full py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50">
                      {cancelling === b.id ? "Cancelling…" : "Cancel Booking"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

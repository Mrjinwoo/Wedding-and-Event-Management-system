"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Venue = {
  id: string; name: string; location: string; capacity: number;
  price: number; image_url: string | null; is_active: boolean; description: string | null;
};

const EMPTY: Omit<Venue, "id"> = {
  name: "", location: "", capacity: 0, price: 0, image_url: "", description: "", is_active: true,
};

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Omit<Venue,"id">>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadVenues = useCallback(async () => {
    setLoading(true);
    const params = search ? `?search=${search}` : "";
    const res = await fetch(`/api/venues${params}`);
    const json = await res.json();
    setVenues(json.data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadVenues(); }, [loadVenues]);

  function openCreate() {
    setForm(EMPTY); setEditId(null); setShowForm(true); setError("");
  }

  function openEdit(v: Venue) {
    setForm({ name: v.name, location: v.location, capacity: v.capacity, price: v.price,
      image_url: v.image_url ?? "", description: v.description ?? "", is_active: v.is_active });
    setEditId(v.id); setShowForm(true); setError("");
  }

  async function saveVenue(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const body = editId ? { id: editId, ...form } : form;
    const res = await fetch("/api/venues", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        imageUrl: form.image_url,
        isActive: form.is_active,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); }
    else { setShowForm(false); loadVenues(); }
    setSaving(false);
  }

  async function deactivateVenue(id: string) {
    if (!confirm("Deactivate this venue?")) return;
    await fetch(`/api/venues?id=${id}`, { method: "DELETE" });
    loadVenues();
  }

  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      <div className="bg-[#1a1a1a] py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-white/60 text-sm hover:text-white">← Admin</Link>
            <h1 className="text-white font-display text-2xl font-bold mt-1">Venue Management</h1>
          </div>
          <button onClick={openCreate}
            className="bg-[#9B2C4A] hover:bg-[#7A1F38] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            + Add Venue
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search venues…"
          className="mb-6 w-full max-w-sm px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A]" />

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-display font-semibold text-[#1a1a1a]">{editId ? "Edit Venue" : "Add New Venue"}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={saveVenue} className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                {([
                  ["name", "Venue Name", "text", true],
                  ["location", "Location", "text", true],
                  ["description", "Description", "text", false],
                  ["image_url", "Image URL", "url", false],
                ] as [keyof typeof form, string, string, boolean][]).map(([key, label, type, required]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type={type} required={required} value={form[key] as string}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A]" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
                    <input type="number" required value={form.capacity}
                      onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱)</label>
                    <input type="number" required value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A]" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="accent-[#9B2C4A]" />
                  Active (visible to users)
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-lg bg-[#9B2C4A] hover:bg-[#7A1F38] text-white text-sm font-semibold transition-colors disabled:opacity-60">
                    {saving ? "Saving…" : editId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map(v => (
              <div key={v.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${!v.is_active ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                <div className="relative h-44 bg-gray-100">
                  {v.image_url ? (
                    <Image src={v.image_url} alt={v.name} fill sizes="33vw" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏛️</div>
                  )}
                  {!v.is_active && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display font-semibold text-[#1a1a1a] text-sm">{v.name}</h3>
                    <span className="text-sm font-bold text-[#9B2C4A] flex-shrink-0">₱{Number(v.price).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{v.location} · {v.capacity} guests</p>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(v)}
                      className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#9B2C4A] hover:text-[#9B2C4A] transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deactivateVenue(v.id)}
                      className="flex-1 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

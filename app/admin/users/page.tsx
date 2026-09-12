"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string; full_name: string; phone: string | null;
  role: string; is_active: boolean; created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    const res = await fetch(`/api/admin/users?${params}`);
    const json = await res.json();
    setUsers(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, search, role]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function updateUser(userId: string, updates: Record<string, unknown>) {
    setUpdating(userId); setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error);
    else loadUsers();
    setUpdating(null);
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      <div className="bg-[#1a1a1a] py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-white/60 text-sm hover:text-white">← Admin</Link>
          <h1 className="text-white font-display text-2xl font-bold mt-1">User Management</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name…"
            className="flex-1 min-w-48 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A]" />
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A]">
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({length:5}).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#1a1a1a]">{u.full_name}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{u.phone ?? "—"}</td>
                  <td className="px-5 py-3">
                    <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}
                      disabled={updating === u.id}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#9B2C4A]">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => updateUser(u.id, { isActive: !u.is_active })} disabled={updating === u.id}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${u.is_active ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600" : "bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => updateUser(u.id, { isActive: false })} disabled={updating === u.id}
                      className="text-xs text-red-400 hover:text-red-600 hover:underline disabled:opacity-50">
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-[#9B2C4A] disabled:opacity-40">← Prev</button>
            <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-[#9B2C4A] disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </main>
  );
}

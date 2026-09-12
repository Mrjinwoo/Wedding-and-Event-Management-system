"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { label: "Home",     href: "/" },
  { label: "Venue",    href: "/venue" },
  { label: "Package",  href: "/package" },
  { label: "Services", href: "/services" },
  { label: "Gallery",  href: "/gallery" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact",  href: "/contact" },
];

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

type Profile = { full_name: string; role: string } | null;
type Notification = { id: string; title: string; body: string; is_read: boolean };

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen]         = useState(false);
  const [profile, setProfile]           = useState<Profile>(null);
  const [unread, setUnread]             = useState(0);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loggingOut, setLoggingOut]     = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  // ── Load logged-in user ──────────────────────────────────────────────────
  const loadUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfile(null); setUnread(0); return; }

    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    setProfile(data);

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setUnread(count ?? 0);
  }, []);

  useEffect(() => { loadUser(); }, [pathname, loadUser]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // ── Actions ──────────────────────────────────────────────────────────────
  async function loadNotifications() {
    if (notifOpen) { setNotifOpen(false); return; }
    const res = await fetch("/api/notifications");
    const json = await res.json();
    setNotifications(json.data ?? []);
    setNotifOpen(true);
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
  }

  async function handleLogout() {
    setLoggingOut(true);
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setProfile(null);
    setUnread(0);
    router.push("/");
    router.refresh();
    setLoggingOut(false);
  }

  // ── Hide on auth pages (AFTER all hooks) ─────────────────────────────────
  if (AUTH_PAGES.some(p => pathname.startsWith(p))) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const dashboardHref = profile?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden shadow">
            <Image
              src="/logo.jpg"
              alt="Wedding and Event Venue"
              width={44} height={44}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="font-display text-sm font-bold tracking-wider uppercase text-[#1a1a1a]">
              Wedding and Event Venue
            </p>
            <p className="font-script text-xs italic text-gray-500">
              Make Every Moment Magical
            </p>
          </div>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-sm font-medium transition-colors relative pb-0.5
                  ${isActive(href)
                    ? "text-[#9B2C4A] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#9B2C4A] after:rounded"
                    : "text-[#1a1a1a] hover:text-[#9B2C4A]"
                  }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {profile ? (
            <>
              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={loadNotifications}
                  aria-label="Notifications"
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#9B2C4A] rounded-full text-[9px] text-white flex items-center justify-center font-bold leading-none">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-[#1a1a1a]">Notifications</p>
                      <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">No notifications</p>
                      ) : notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                          <p className="text-sm font-medium text-[#1a1a1a]">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <Link
                        href="/dashboard/messages"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#9B2C4A] hover:underline font-medium"
                      >
                        View all messages →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User name + role badge → dashboard */}
              <Link
                href={dashboardHref}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-base">👤</span>
                <span className="text-sm font-medium text-[#1a1a1a] max-w-24 truncate">
                  {profile.full_name.split(" ")[0]}
                </span>
                {profile.role === "admin" && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
                    Admin
                  </span>
                )}
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loggingOut ? "…" : "Logout"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-[#9B2C4A] hover:bg-[#7A1F38] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              Login/Register
            </Link>
          )}

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className={`block h-0.5 w-5 bg-[#1a1a1a] rounded transition-all duration-200 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#1a1a1a] rounded transition-all duration-200 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#1a1a1a] rounded transition-all duration-200 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-screen" : "max-h-0"}`}>
        <div className="bg-white border-t border-gray-100 shadow-md">
          <ul className="flex flex-col py-2">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors border-l-4
                    ${isActive(href)
                      ? "text-[#9B2C4A] border-[#9B2C4A] bg-[#F5E6EA]"
                      : "text-[#1a1a1a] border-transparent hover:text-[#9B2C4A] hover:bg-gray-50"
                    }`}
                >
                  {label}
                </Link>
              </li>
            ))}

            {/* Divider */}
            <li className="border-t border-gray-100 my-1" />

            {profile ? (
              <>
                <li>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-[#1a1a1a] border-l-4 border-transparent hover:text-[#9B2C4A] hover:bg-gray-50 transition-colors"
                  >
                    <span>👤</span>
                    <span>{profile.full_name.split(" ")[0]}</span>
                    {profile.role === "admin" && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
                    )}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 px-6 py-3 text-sm font-medium text-red-500 border-l-4 border-transparent hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <span>🚪</span>
                    {loggingOut ? "Logging out…" : "Logout"}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#9B2C4A] border-l-4 border-[#9B2C4A] bg-[#F5E6EA]"
                >
                  Login / Register
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
}

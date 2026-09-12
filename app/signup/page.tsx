"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/validation";

type Step = "form" | "verify";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "", agree: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setFieldErrors({});

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsed.error.issues.forEach((e: any) => { if (e.path[0]) errs[String(e.path[0])] = e.message; });
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setRegisteredEmail(form.email);
      setStep("verify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setSuccess("Verification email resent! Check your inbox.");
    } catch {
      setError("Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Form ── */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-8 py-12 bg-[#F5E6EA] overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-md">
              <Image src="/logo.jpg" alt="Event Venue Logo" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-widest uppercase text-[#1a1a1a]">Event Venue</h1>
            <p className="font-script text-sm italic text-gray-500 mt-0.5">Make Every Moment Magical</p>
          </div>

          {step === "form" ? (
            <>
              <div className="mb-5">
                <h2 className="font-display text-2xl font-bold text-[#1a1a1a]">Create Account</h2>
                <p className="text-xs text-gray-500 mt-1">Sign up to get started</p>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                    <input type="text" name="fullName" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} required
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.fullName ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
                    <input type="email" name="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Phone Number <span className="text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📞</span>
                    <input type="tel" name="phone" placeholder="09171234567" value={form.phone} onChange={handleChange}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.phone ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    <input type="password" name="password" placeholder="Create a password" value={form.password} onChange={handleChange} required
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">Min 8 chars, 1 uppercase, 1 number, 1 special character</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    <input type="password" name="confirmPassword" placeholder="Confirm your password" value={form.confirmPassword} onChange={handleChange} required
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.confirmPassword ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} required
                    className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 accent-[#9B2C4A] flex-shrink-0" />
                  <span>I agree to the <Link href="/terms" className="text-[#9B2C4A] hover:underline">Terms of service</Link> and <Link href="/privacy" className="text-[#9B2C4A] hover:underline">Privacy Policy</Link></span>
                </label>

                <button type="submit" disabled={loading || !form.agree}
                  className="w-full py-3 rounded-lg bg-[#9B2C4A] hover:bg-[#7A1F38] disabled:opacity-60 text-white font-display text-lg font-semibold tracking-wide transition-colors shadow-sm mt-1">
                  {loading ? "Creating account…" : "Sign Up"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-5">
                Already have an account? <Link href="/login" className="font-medium text-[#9B2C4A] hover:underline">Log In</Link>
              </p>
            </>
          ) : (
            /* ── OTP / Email Verification Step ── */
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="font-display text-2xl font-bold text-[#1a1a1a] mb-2">Verify Your Email</h2>
              <p className="text-sm text-gray-500 mb-2">We sent a verification link to</p>
              <p className="font-semibold text-[#9B2C4A] mb-6">{registeredEmail}</p>
              <p className="text-xs text-gray-500 mb-6">Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.</p>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{success}</div>}

              <button onClick={handleResend} disabled={resending}
                className="w-full py-2.5 rounded-lg border-2 border-[#9B2C4A] text-[#9B2C4A] hover:bg-[#9B2C4A] hover:text-white font-semibold text-sm transition-colors mb-3 disabled:opacity-60">
                {resending ? "Resending…" : "Resend Verification Email"}
              </button>

              <button onClick={() => router.push("/login")}
                className="w-full py-2.5 rounded-lg bg-[#9B2C4A] hover:bg-[#7A1F38] text-white font-semibold text-sm transition-colors">
                Go to Login
              </button>

              <button onClick={() => setStep("form")} className="mt-4 text-xs text-gray-400 hover:text-gray-600 hover:underline">
                ← Back to form
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Image ── */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <Image src="/wed.jpg" alt="Beautiful wedding venue" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute bottom-16 left-0 right-0 text-center px-10">
          <span className="text-white text-4xl leading-none opacity-60">&ldquo;</span>
          <p className="text-white font-sans text-xl font-light leading-relaxed mt-1">We don&apos;t just<br />find venues,</p>
          <p className="font-script text-white text-2xl italic mt-1">we create memories.</p>
          <div className="mt-4 text-white text-base opacity-70">♥</div>
        </div>
      </div>
    </div>
  );
}

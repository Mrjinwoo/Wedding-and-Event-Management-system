"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/validation";

type Step = "form" | "otp";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Form state ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    password: "", confirmPassword: "", agree: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── OTP state ───────────────────────────────────────────────────────────
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ── Form handlers ────────────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setFieldErrors({});

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsed.error.issues.forEach((i: any) => { if (i.path[0]) errs[String(i.path[0])] = i.message; });
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
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
      // Focus first OTP box
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handlers ───────────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");

    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === OTP_LENGTH - 1) {
      const code = [...next].join("");
      if (code.length === OTP_LENGTH) {
        verifyOtp(code);
      }
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        // Move to previous
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setOtp(next);
    // Focus last filled box
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === OTP_LENGTH) verifyOtp(pasted);
  }

  async function verifyOtp(code: string) {
    setVerifying(true); setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, token: code, type: "email" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        // Clear OTP boxes on error
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }
      setVerified(true);
      setTimeout(() => router.push("/login?message=email_verified"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setError("Please enter all 6 digits."); return; }
    verifyOtp(code);
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true); setError("");
    setOtp(Array(OTP_LENGTH).fill(""));
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const otpFilled = otp.every(d => d !== "");

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-8 py-12 bg-[#F5E6EA] overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-md">
              <Image src="/logo.png" alt="Event Venue Logo" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-widest uppercase text-[#1a1a1a]">Event Venue</h1>
            <p className="font-script text-sm italic text-gray-500 mt-0.5">Make Every Moment Magical</p>
          </div>

          {/* ══ STEP 1: Registration form ══ */}
          {step === "form" && (
            <>
              <div className="mb-5">
                <h2 className="font-display text-2xl font-bold text-[#1a1a1a]">Create Account</h2>
                <p className="text-xs text-gray-500 mt-1">Sign up to get started</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                    <input type="text" name="fullName" placeholder="Enter your full name"
                      value={form.fullName} onChange={handleChange} required
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.fullName ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.fullName && <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
                    <input type="email" name="email" placeholder="Enter your email"
                      value={form.email} onChange={handleChange} required
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📞</span>
                    <input type="tel" name="phone" placeholder="09171234567"
                      value={form.phone} onChange={handleChange}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.phone ? "border-red-400" : "border-gray-300"}`} />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Create a password"
                      value={form.password} onChange={handleChange} required
                      className={`w-full pl-9 pr-10 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`} />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password
                    ? <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                    : <p className="text-[11px] text-gray-400 mt-1">Min 8 chars · 1 uppercase · 1 number · 1 special character</p>
                  }
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Confirm your password"
                      value={form.confirmPassword} onChange={handleChange} required
                      className={`w-full pl-9 pr-10 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent placeholder-gray-400 ${fieldErrors.confirmPassword ? "border-red-400" : "border-gray-300"}`} />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirm ? "Hide password" : "Show password"}>
                      {showConfirm ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} required
                    className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 accent-[#9B2C4A] flex-shrink-0" />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" className="text-[#9B2C4A] hover:underline">Terms of service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-[#9B2C4A] hover:underline">Privacy Policy</Link>
                  </span>
                </label>

                <button type="submit" disabled={loading || !form.agree}
                  className="w-full py-3 rounded-lg bg-[#9B2C4A] hover:bg-[#7A1F38] disabled:opacity-60 text-white font-display text-lg font-semibold tracking-wide transition-colors shadow-sm">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Creating account…
                    </span>
                  ) : "Sign Up"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#9B2C4A] hover:underline">Log In</Link>
              </p>
            </>
          )}

          {/* ══ STEP 2: OTP Verification ══ */}
          {step === "otp" && (
            <div>
              {verified ? (
                /* ── Success state ── */
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#1a1a1a] mb-2">Email Verified!</h2>
                  <p className="text-sm text-gray-500">Redirecting you to login…</p>
                  <div className="mt-4 flex justify-center">
                    <svg className="w-5 h-5 animate-spin text-[#9B2C4A]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                /* ── OTP input state ── */
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[#F5E6EA] border-2 border-[#9B2C4A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#9B2C4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-[#1a1a1a]">Verify Your Email</h2>
                    <p className="text-sm text-gray-500 mt-2">
                      We sent a 6-digit code to
                    </p>
                    <p className="font-semibold text-[#9B2C4A] text-sm mt-0.5">{registeredEmail}</p>
                    <p className="text-xs text-gray-400 mt-1">Check your inbox and spam folder</p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleVerifySubmit}>
                    {/* 6 OTP boxes */}
                    <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={el => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(index, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(index, e)}
                          disabled={verifying || verified}
                          aria-label={`OTP digit ${index + 1}`}
                          className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white transition-all duration-150 focus:outline-none
                            ${digit ? "border-[#9B2C4A] text-[#9B2C4A]" : "border-gray-200 text-[#1a1a1a]"}
                            ${verifying ? "opacity-60 cursor-not-allowed" : "focus:border-[#9B2C4A] focus:ring-2 focus:ring-[#9B2C4A]/20"}
                            ${error ? "border-red-300" : ""}
                          `}
                        />
                      ))}
                    </div>

                    {/* Verify button */}
                    <button
                      type="submit"
                      disabled={!otpFilled || verifying}
                      className="w-full py-3 rounded-lg bg-[#9B2C4A] hover:bg-[#7A1F38] disabled:opacity-50 text-white font-display text-lg font-semibold tracking-wide transition-colors shadow-sm"
                    >
                      {verifying ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          Verifying…
                        </span>
                      ) : "Verify Code"}
                    </button>
                  </form>

                  {/* Resend */}
                  <div className="mt-5 text-center">
                    <p className="text-xs text-gray-500 mb-2">Didn&apos;t receive the code?</p>
                    {cooldown > 0 ? (
                      <p className="text-xs text-gray-400">
                        Resend available in{" "}
                        <span className="font-semibold text-[#9B2C4A]">{cooldown}s</span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={resending}
                        className="text-sm font-semibold text-[#9B2C4A] hover:underline disabled:opacity-50 transition-opacity"
                      >
                        {resending ? "Sending…" : "Resend Code"}
                      </button>
                    )}
                  </div>

                  {/* Back */}
                  <button
                    onClick={() => { setStep("form"); setOtp(Array(OTP_LENGTH).fill("")); setError(""); }}
                    className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 hover:underline transition-colors"
                  >
                    ← Use a different email
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Right: image panel ── */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <Image src="/wed.jpg" alt="Beautiful wedding venue" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute bottom-16 left-0 right-0 text-center px-10">
          <span className="text-white text-4xl leading-none opacity-60">&ldquo;</span>
          <p className="text-white font-sans text-xl font-light leading-relaxed mt-1">
            We don&apos;t just<br />find venues,
          </p>
          <p className="font-script text-white text-2xl italic mt-1">we create memories.</p>
          <div className="mt-4 text-white text-base opacity-70">♥</div>
        </div>
      </div>
    </div>
  );
}
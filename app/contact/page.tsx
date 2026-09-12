"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    guests: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up form submission (email / API)
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      {/* Page header */}
      <section className="bg-[#F5E6EA] py-14 text-center">
        <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">Contact Us</h1>
        <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
          Ready to plan your perfect event? Reach out and our team will get back to you within 24 hours.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Contact info ── */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1a1a1a] mb-4">
              Get in Touch
            </h2>
            <div className="space-y-4">
              {[
                { icon: "📍", label: "Address",  value: "123 Event Drive, Cebu City, Cebu 6000" },
                { icon: "📞", label: "Phone",    value: "+63 917 123 4567" },
                { icon: "✉",  label: "Email",    value: "hello@weddingeventvenue.ph" },
                { icon: "🕐", label: "Hours",    value: "Mon – Sat, 9:00 AM – 6:00 PM" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#9B2C4A] uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-600">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <p className="text-xs font-semibold text-[#9B2C4A] uppercase tracking-wide mb-3">
              Follow Us
            </p>
            <div className="flex gap-3">
              {["Facebook", "Instagram", "TikTok"].map((s) => (
                <span
                  key={s}
                  className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-[#9B2C4A] hover:text-[#9B2C4A] cursor-pointer transition-colors"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Inquiry form ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <span className="text-5xl mb-4">💌</span>
              <h3 className="font-display text-2xl font-semibold text-[#1a1a1a] mb-2">
                Message Received!
              </h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Thank you for reaching out. Our team will contact you within 24 hours to discuss your event.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", eventType: "", eventDate: "", guests: "", message: "" }); }}
                className="mt-6 text-sm text-[#9B2C4A] hover:underline font-medium"
              >
                Send another inquiry
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-[#1a1a1a] mb-6">
                Send an Inquiry
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                    <input
                      type="text" name="name" required value={form.name} onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
                    <input
                      type="email" name="email" required value={form.email} onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+63 9xx xxx xxxx"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Event Type *</label>
                    <select
                      name="eventType" required value={form.eventType} onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent text-gray-600"
                    >
                      <option value="">Select event type</option>
                      <option>Wedding</option>
                      <option>Birthday / Debut</option>
                      <option>Corporate Event</option>
                      <option>Graduation Party</option>
                      <option>Reception / Gala</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                    <input
                      type="date" name="eventDate" value={form.eventDate} onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Expected Guests</label>
                    <input
                      type="number" name="guests" value={form.guests} onChange={handleChange}
                      placeholder="e.g. 200"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange} rows={4}
                    placeholder="Tell us more about your event vision..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B2C4A] focus:border-transparent resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-[#9B2C4A] hover:bg-[#7A1F38] text-white font-semibold transition-colors"
                >
                  Send Inquiry
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

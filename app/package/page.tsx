import Link from "next/link";

const PACKAGES = [
  {
    name: "Silver Package",
    price: "₱ 35,000",
    color: "border-gray-300",
    badge: "bg-gray-100 text-gray-600",
    features: [
      "Venue for up to 150 guests",
      "Basic floral centerpieces",
      "Standard sound system",
      "5-hour venue rental",
      "1 event coordinator",
      "Basic lighting setup",
    ],
  },
  {
    name: "Gold Package",
    price: "₱ 55,000",
    color: "border-[#9B2C4A]",
    badge: "bg-[#9B2C4A] text-white",
    popular: true,
    features: [
      "Venue for up to 300 guests",
      "Premium floral arrangements",
      "Professional sound & lighting",
      "8-hour venue rental",
      "2 event coordinators",
      "Photo & video coverage",
      "Catering for 300 pax",
    ],
  },
  {
    name: "Platinum Package",
    price: "₱ 85,000",
    color: "border-[#C9A96E]",
    badge: "bg-[#C9A96E] text-white",
    features: [
      "Venue for up to 500 guests",
      "Luxury floral & décor setup",
      "Full AV production team",
      "12-hour venue rental",
      "Dedicated event manager",
      "Full photo & video package",
      "Catering for 500 pax",
      "Bridal suite access",
      "Free rehearsal day",
    ],
  },
];

export default function PackagePage() {
  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      {/* Page header */}
      <section className="bg-[#F5E6EA] py-14 text-center">
        <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">Packages</h1>
        <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
          Choose the perfect package for your event. All packages can be customized to suit your vision and budget.
        </p>
      </section>

      {/* Package cards */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative bg-white rounded-2xl border-2 ${pkg.color} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
            >
              {pkg.popular && (
                <div className="absolute top-4 right-4">
                  <span className="bg-[#9B2C4A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="p-7">
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${pkg.badge}`}>
                  {pkg.name}
                </span>
                <p className="font-display text-3xl font-bold text-[#1a1a1a] mb-1">
                  {pkg.price}
                </p>
                <p className="text-xs text-gray-400 mb-6">per event</p>
                <ul className="space-y-2.5 mb-8">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-[#9B2C4A] mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`block text-center w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    pkg.popular
                      ? "bg-[#9B2C4A] hover:bg-[#7A1F38] text-white"
                      : "border border-[#9B2C4A] text-[#9B2C4A] hover:bg-[#9B2C4A] hover:text-white"
                  }`}
                >
                  Book This Package
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

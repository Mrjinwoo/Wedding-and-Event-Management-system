import Link from "next/link";

const SERVICES = [
  {
    icon: "💍",
    title: "Weddings",
    description:
      "From intimate ceremonies to grand celebrations, we craft bespoke wedding experiences tailored to your love story.",
  },
  {
    icon: "🎂",
    title: "Birthdays & Debuts",
    description:
      "Celebrate life's milestones in style. We handle everything from venue décor to catering for your special day.",
  },
  {
    icon: "🏢",
    title: "Corporate Events",
    description:
      "Professional event management for conferences, product launches, seminars, and company celebrations.",
  },
  {
    icon: "🎓",
    title: "Graduation Parties",
    description:
      "Honor your achievements with a memorable gathering. We provide the perfect backdrop for your next chapter.",
  },
  {
    icon: "🥂",
    title: "Receptions & Galas",
    description:
      "Elegant settings for cocktail receptions, charity galas, and formal dinners with impeccable service.",
  },
  {
    icon: "🌸",
    title: "Floral & Décor",
    description:
      "Our in-house design team creates stunning floral arrangements and themed décor that bring your vision to life.",
  },
  {
    icon: "📸",
    title: "Photo & Video",
    description:
      "Capture every precious moment with our partner photographers and videographers skilled in event coverage.",
  },
  {
    icon: "🍽️",
    title: "Catering",
    description:
      "Delight your guests with curated menus from our partner caterers — from Filipino classics to international cuisine.",
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      {/* Page header */}
      <section className="bg-[#F5E6EA] py-14 text-center">
        <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">Our Services</h1>
        <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
          Everything you need for a flawless event, all under one roof. We handle the details so you can enjoy the moment.
        </p>
      </section>

      {/* Services grid */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col gap-3"
            >
              <span className="text-4xl">{service.icon}</span>
              <h3 className="font-display text-lg font-semibold text-[#1a1a1a]">
                {service.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Have a custom event in mind? Let&apos;s talk about it.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-[#9B2C4A] hover:bg-[#7A1F38] text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </main>
  );
}

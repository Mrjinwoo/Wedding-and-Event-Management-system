import Image from "next/image";
import Link from "next/link";

const TEAM = [
  { name: "Maria Santos",   role: "Founder & Head Coordinator" },
  { name: "Jose Reyes",     role: "Venue Operations Manager" },
  { name: "Ana Dela Cruz",  role: "Floral & Décor Designer" },
  { name: "Carlo Mendoza",  role: "Client Relations Manager" },
];

const STATS = [
  { value: "500+", label: "Events Hosted" },
  { value: "10+",  label: "Years of Experience" },
  { value: "4",    label: "Stunning Venues" },
  { value: "98%",  label: "Client Satisfaction" },
];

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      {/* Page header */}
      <section className="bg-[#F5E6EA] py-14 text-center">
        <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">About Us</h1>
        <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
          We are passionate about creating beautiful, meaningful experiences for every milestone in your life.
        </p>
      </section>

      {/* Story section */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative h-80 rounded-2xl overflow-hidden shadow-md">
          <Image
            src="/wed.jpg"
            alt="Our story"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="font-display text-3xl font-bold text-[#1a1a1a] mb-4">
            Our Story
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Founded over a decade ago in the heart of Cebu City, Wedding and Event Venue was born from a simple dream — to give every couple and family a place where their most precious memories could be made.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            What started as a single garden venue has grown into a collection of four breathtaking spaces, each with its own character and charm. From seaside ceremonies to grand indoor banquets, we have hosted over 500 events and counting.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-[#9B2C4A] hover:bg-[#7A1F38] text-white font-semibold px-7 py-2.5 rounded-lg transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#9B2C4A] py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-4xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/70 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-[#1a1a1a] mb-2">Meet the Team</h2>
        <p className="text-gray-500 text-sm mb-10">
          The dedicated people behind every magical moment.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-[#F5E6EA] flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👤</span>
              </div>
              <h4 className="font-display text-sm font-semibold text-[#1a1a1a]">{member.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

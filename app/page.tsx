import Image from "next/image";
import Link from "next/link";

const VENUES = [
  {
    name: "Seaside View Events",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 50,000",
    image: "/back.jpg",
  },
  {
    name: "The Garden Of Love",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 45,000",
    image: "/day.jpg",
  },
  {
    name: "Royal Banquet Hall",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 55,000",
    image: "/weeding venue.jpg",
  },
  {
    name: "The Grand Pavilion",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 48,000",
    image: "/birth.jpg",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col bg-white">

      {/* ── Hero ── */}
      <section className="relative w-full h-[420px] overflow-hidden">
        <Image
          src="/background.png"
          alt="Celebrate life's special moments"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-sans text-4xl md:text-5xl font-semibold text-white drop-shadow-lg leading-tight">
            Celebrate life&apos;s
          </h1>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#D4607A] drop-shadow-lg leading-tight mt-1">
            Special Moments
          </h2>
          <p className="mt-4 text-white text-base md:text-lg max-w-xl drop-shadow leading-relaxed">
            Find the perfect venue for weddings, receptions, debuts,
            <br className="hidden md:block" />
            corporate events and more.
          </p>
        </div>
        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`block w-2 h-2 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </section>

      {/* ── Venue Cards ── */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VENUES.map((venue) => (
            <Link
              key={venue.name}
              href={`/venue`}
              className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-100"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={venue.image}
                  alt={venue.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-[#1a1a1a] leading-snug">
                    {venue.name}
                  </h3>
                  <span className="font-semibold text-sm text-[#1a1a1a] whitespace-nowrap">
                    {venue.price}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{venue.location}</p>
                <p className="text-xs text-gray-500">{venue.capacity}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

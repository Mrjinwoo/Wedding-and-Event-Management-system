import Image from "next/image";
import Link from "next/link";

const VENUES = [
  {
    name: "Seaside View Events",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 50,000",
    image: "/back.jpg",
    description:
      "A breathtaking beachside venue perfect for intimate ceremonies and grand receptions with panoramic ocean views.",
  },
  {
    name: "The Garden Of Love",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 45,000",
    image: "/day.jpg",
    description:
      "An enchanting garden setting surrounded by lush greenery and golden-hour sunsets for your perfect celebration.",
  },
  {
    name: "Royal Banquet Hall",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 55,000",
    image: "/weeding venue.jpg",
    description:
      "An elegant indoor ballroom draped in soft blush tones with chandeliers, ideal for weddings and galas.",
  },
  {
    name: "The Grand Pavilion",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 48,000",
    image: "/birth.jpg",
    description:
      "A versatile grand pavilion that transforms beautifully for debuts, birthdays, and corporate celebrations.",
  },
  {
    name: "The Grand",
    location: "Cebu City, Cebu",
    capacity: "300–500 Guests",
    price: "₱ 48,000",
    image: "/wedd.jpg",
    description:
      "A versatile grand pavilion that transforms beautifully for debuts, birthdays, and corporate celebrations.",
  },
];

export default function VenuePage() {
  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      {/* Page header */}
      <section className="bg-[#F5E6EA] py-14 text-center">
        <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">Our Venues</h1>
        <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
          Discover our stunning collection of event spaces in Cebu City, each crafted to make your celebration unforgettable.
        </p>
      </section>

      {/* Venue grid */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {VENUES.map((venue) => (
            <div
              key={venue.name}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={venue.image}
                  alt={venue.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display text-base font-semibold text-[#1a1a1a] leading-snug">
                    {venue.name}
                  </h3>
                  <span className="text-sm font-semibold text-[#9B2C4A] whitespace-nowrap">
                    {venue.price}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {venue.location} · {venue.capacity}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {venue.description}
                </p>
                <Link
                  href="/contact"
                  className="block text-center w-full py-2 rounded-lg bg-[#9B2C4A] hover:bg-[#7A1F38] text-white text-xs font-semibold transition-colors"
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

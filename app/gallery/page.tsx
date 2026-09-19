import Image from "next/image";

const PHOTOS = [
  { src: "/wed.jpg",           alt: "Wedding ceremony",        span: "col-span-2 row-span-2" },
  { src: "/back.jpg",          alt: "Seaside event setup",     span: "" },
  { src: "/birth.jpg",         alt: "Birthday celebration",    span: "" },
  { src: "/day.jpg",           alt: "Garden of Love venue",    span: "" },
  { src: "/weeding venue.jpg", alt: "Royal Banquet Hall",      span: "" },
  { src: "/wedd.jpg",          alt: "The Grand",               span: "" },
];

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F5]">
      {/* Page header */}
      <section className="bg-[#F5E6EA] py-14 text-center">
        <h1 className="font-display text-4xl font-bold text-[#1a1a1a]">Gallery</h1>
        <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
          A glimpse into the magical moments we&apos;ve helped create. Every event tells a unique story.
        </p>
      </section>

      {/* Masonry-style grid */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className={`relative rounded-2xl overflow-hidden group ${photo.span}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <p className="absolute bottom-3 left-3 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                {photo.alt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

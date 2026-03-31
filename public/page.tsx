import Image from "next/image";

export default function Page() {
  return (
    <main className="relative w-full min-h-screen flex items-center overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/hero-background.jpg"
          alt="Hero Image"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Dark overlay */}
      {/* <div className="absolute inset-0 bg-black bg-opacity-40"></div> */}

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-white">
        <span className="inline-block px-4 py-2 mb-4 rounded-full border-2 border-white text-white font-semibold text-sm">
          Trusted by 10,000+ STR operators
        </span>

        <h1 className="mt-4 text-5xl md:text-7xl leading-tight">
          Find STR tools <br />
          that fit your <br />
          <span className="text-[#2B6CB0]">operation</span>
        </h1>

        <p className="mt-6 text-gray-200 text-lg">
          Browse 400+ providers. Filter by category, integrations, pricing & more.
          Make informed decisions backed by 15,000+ real reviews.
        </p>

        {/* Search Field */}
        <div className="mt-8">
          <input
            type="text"
            placeholder="Search providers, categories, integrations..."
            className="w-full px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>
    </main>
  );
}

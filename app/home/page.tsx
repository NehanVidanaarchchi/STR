import HeroFilterStepper from "./components/HeroFilterStepper";
import Marketplace from "./components/Marketplace";

export default function Page() {
  return (
    <main className="relative w-full bg-gray-50">
      <div 
        className="relative w-full pt-32 pb-24 flex items-center justify-center"
        style={{ backgroundImage: 'linear-gradient(135deg, #1a365d 0%, #2a4a7f 40%, #1e3a5f 70%, #1a365d 100%)' }}
      >
        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center text-white">
          <span className="inline-block px-4 py-1.5 mb-6 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white font-medium text-sm">
            Trusted by 10,000+ STR operators
          </span>

          <h1 className="mt-2 !text-4xl md:text-6xl font-extrabold tracking-tight">
            Find Your Perfect STR Tool & Services
          </h1>

          <p className="mt-6 text-blue-100 text-xl max-w-3xl mx-auto font-light">
            Browse, compare, and discover the solutions that work for your business
          </p>

          {/* Stepper text */}
          <div className="mt-16 mb-4 flex items-center justify-center gap-3 text-lg font-medium text-blue-100">
            <span className="h-px bg-white/20 w-12"></span>
            Personalise — tell us what's relevant for you
            <span className="h-px bg-white/20 w-12"></span>
          </div>

          {/* New Stepper Filters */}
          <HeroFilterStepper />
        </div>
      </div>

      <section className="py-12 z-2 relative">
        <div className="container mx-auto px-6">
          <Marketplace />
        </div>
      </section>     
    </main>
  );
}

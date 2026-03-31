import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      <Header />
      <main className="flex-grow flex flex-col items-center">
        {children}
      </main>
      <Footer />
    </div>
  );
}

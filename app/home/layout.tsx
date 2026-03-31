// app/(public)/layout.tsx
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex">
        {children}
      </main>

      <Footer />
    </div>
  );
}
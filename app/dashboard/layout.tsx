import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import CompanyHeader from "@/components/dashboard/CompanyHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Company Header - Appears on all dashboard pages */}
        <div className="bg-white">
          <div className="container mx-auto px-6 py-8">
            <CompanyHeader />
          </div>
        </div>
        
        {/* Dashboard Tabs - Navigation for all dashboard pages */}
        <div className="bg-white">
          <div className="container mx-auto px-6">
            <DashboardTabs />
          </div>
        </div>
        
        {/* Page Content - Changes based on selected tab */}
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
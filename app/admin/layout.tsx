import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AdminDashboardTabs from "@/components/dashboard/AdminDashboardTabs";
import AdminHeader from "@/components/dashboard/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Admin Header - Appears on all admin pages */}
        <div className="bg-white">
          <div className="container mx-auto px-6 py-8">
            <AdminHeader />
          </div>
        </div>
        
        {/* Admin Dashboard Tabs - Navigation for all admin pages */}
        <div className="bg-white">
          <div className="container mx-auto px-6">
            <AdminDashboardTabs />
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
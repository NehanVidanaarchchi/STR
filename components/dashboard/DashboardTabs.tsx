"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Briefcase,
  Package,
  Plug,
  DollarSign,
  TrendingUp,
  Settings,
} from "lucide-react";

const tabItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Company Profile", href: "/dashboard/company-profile", icon: Briefcase },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { name: "Visibility", href: "/dashboard/commercial", icon: TrendingUp },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto px-6 border-[#E2E8F0]">
        <div className="flex space-x-1 overflow-x-auto py-2 -mx-1 px-1">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#f3f7ff] text-[#2B6CB0] border-b-2 border-[#2B6CB0]"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-[14px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
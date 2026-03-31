"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  Building2,
  BarChart3,
  MessageSquare,
  Eye,
  MapPinCheck,
  CreditCard,
} from "lucide-react";

const tabItems = [
  { name: "Providers", href: "/admin/providers", icon: FileText},
  { name: "Company", href: "/admin/company-leads", icon: Building2, badge: null },
  { name: "Lead Analytics", href: "/admin/lead-analytics", icon: BarChart3, badge: null },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { name: "Field Requests", href: "/admin/field-requests", icon: MapPinCheck },
{ name: "Profile Plans", href: "/admin/profile-plans", icon: CreditCard },
{ name: "Users", href: "/admin", icon: Users, badge: null },
];

export default function AdminDashboardTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto px-6 border-[#E2E8F0]">
        <div className="flex space-x-1 overflow-x-auto py-2 -mx-1 px-1">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href));
            
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
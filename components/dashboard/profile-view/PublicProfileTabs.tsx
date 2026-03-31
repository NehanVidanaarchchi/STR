"use client";

import { useState, useMemo } from "react";
import {
  LayoutGrid,
  Star,
  Image,
  Plug,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "features", label: "Features", icon: CheckCircle },
  { id: "screenshots", label: "Screenshots", icon: Image },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
];

const modulesByCategory: Record<string, any[]> = {}
interface PublicProfileTabsProps {
  company: any;
  isLoading: boolean;
}
interface Feature {
  id: string
  name: string
  module_id: string
}
interface Integration {
  id: string
  integration_type: string
  status: string
}
interface Module {
  id: string
  name: string
  description?: string
  category: string
  features?: Feature[]
}

interface Product {
  id: string
  name: string
  modules?: Module[]
  features?: Feature[]
}
interface Company {
  id: string
  name: string
  products?: Product[]
  integrations?: Integration[]

}
export default function PublicProfileTabs({ company, isLoading }: PublicProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const platformCapabilities = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        company?.products
          ?.map((p: any) => p.primary_type)
          .filter(Boolean)
      )
    );
  }, [company]);

  const SUPABASE_PUBLIC_STORAGE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL +
    "/storage/v1/object/public/product-screenshots";

  const allScreenshots = useMemo(() => {
    if (!company?.products) return []

    return company.products.flatMap((product: any) =>
      (product.screenshots || []).map((screenshot: any) => ({
        ...screenshot,
        productName: product.name,
      }))
    )
  }, [company])

  const modulesByCategory = useMemo<Record<string, Module[]>>(() => {
    const map: Record<string, Module[]> = {}

    company?.products?.forEach((product: Product) => {
      product.modules?.forEach((module: Module) => {
        if (!module.category) return
        if (!map[module.category]) map[module.category] = []
        // Avoid duplicates
        if (!map[module.category].some((m) => m.id === module.id)) {
          map[module.category].push(module)
        }
      })
    })

    return map
  }, [company])


  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About {company?.name}</h3>
              <p className="text-gray-700 leading-relaxed">
                {company?.product_summary_long}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Founded</div>
                    <div className="text-lg font-medium text-gray-900">{company?.founded_year}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Headquarters</div>
                    <div className="text-lg font-medium text-gray-900">{company?.country}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Team Size</div>
                    <div className="text-lg font-medium text-gray-900">{company?.team_size}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Platform Capabilities</h4>
                <div className="grid grid-cols-2 gap-4">
                  {platformCapabilities.map((capability) => (
                    <div
                      key={capability}
                      className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center"
                    >
                      <div className="text-sm font-medium text-blue-900">
                        {capability}
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Key Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {["Multi-property", "Channel Manager", "Automated Messaging", "API Access"].map(
                  (highlight) => (
                    <div
                      key={highlight}
                      className="bg-gradient-to-br from-gray-50 to-white border rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-900">{highlight}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "features":
        return (
          <div className="space-y-8">
            {Object.entries(modulesByCategory).map(([category, modules]) => (
              <div key={category} className="bg-white rounded-xl p-6 border">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((module) => (
                    <div key={module.id} className="bg-gray-50 rounded-lg p-5 border hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{module.name}</h4>
                          {module.description && (
                            <p className="text-sm text-gray-600">{module.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(modulesByCategory).length === 0 && (
              <div className="text-center text-gray-500 py-12">No features available</div>
            )}
          </div>
        )

      case "screenshots":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Screenshots
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {company?.products?.flatMap((product: any) =>
                  product.screenshots?.map((shot: any) => (
                    <div
                      key={shot.id}
                      className="rounded-xl overflow-hidden border bg-white"
                    >
                      <img
                        src={
                          shot.url ||
                          `${SUPABASE_PUBLIC_STORAGE_URL}/${shot.file_path}`
                        }
                        alt="Product screenshot"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.src = "/placeholder.png" // optional fallback
                        }}
                      />

                    </div>
                  ))
                )}
              </div>

              {company?.products?.every(
                (p: any) => !p.screenshots || p.screenshots.length === 0
              ) && (
                  <div className="text-center text-gray-500 py-12">
                    No screenshots available
                  </div>
                )}
            </div>
          </div>
        )
      case "integrations":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Integrations
              </h3>

              {company?.integrations?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {company.integrations.map((integration: any) => (
                    <div
                      key={integration.id}
                      className="bg-white border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-white border mb-3 flex items-center justify-center">
                        <Plug className="w-6 h-6 text-gray-600" />
                      </div>

                      <span className="font-medium text-gray-900 capitalize">
                        {integration.company_name.replace(/_/g, " ")}
                      </span>

                      <span
                        className={`text-xs mt-1 ${integration.status === "active"
                            ? "text-green-600"
                            : "text-yellow-600"
                          }`}
                      >
                        {integration.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No integrations connected
                </div>
              )}
            </div>
          </div>
        )

        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Integrations</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  "Airbnb",
                  "Booking.com",
                  "Vrbo",
                  "Stripe",
                  "QuickBooks",
                  "Google Calendar",
                ].map((integration) => (
                  <div
                    key={integration}
                    className="bg-white border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-white border mb-3 flex items-center justify-center">
                      <Plug className="w-6 h-6 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900">{integration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
                  <p className="text-gray-600">4.8 average based on 342 reviews</p>
                </div>
                <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                  Write a Review
                </button>
              </div>

              <div className="space-y-6">
                {[1, 2, 3].map((review) => (
                  <div key={review} className="border-b pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100" />
                        <div>
                          <h4 className="font-semibold text-gray-900">John Doe</h4>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= 4 ? "text-amber-500 fill-amber-500" : "text-amber-300"}`}
                              />
                            ))}
                            <span className="text-sm text-gray-500 ml-2">2 weeks ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700">
                      Excellent property management software! The channel manager saved us hours of manual work. Customer support is responsive and helpful.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      {/* Tabs Navigation */}
      <div className="flex space-x-1 border-b mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${activeTab === tab.id
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
}
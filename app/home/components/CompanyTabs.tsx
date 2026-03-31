"use client";

import { useState, useMemo } from "react";
import {
  LayoutGrid,
  Star,
  Image,
  Plug,
  MessageSquare,
  CheckCircle,
  Building,
  Briefcase,
  TrendingUp,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "features", label: "Features", icon: CheckCircle },
  { id: "screenshots", label: "Screenshots", icon: Image },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "pricing", label: "Pricing", icon: TrendingUp },
];

interface CompanyTabsProps {
  company: any;
  isLoading: boolean;
}

export default function CompanyTabs({ company, isLoading }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

    const SUPABASE_PUBLIC_STORAGE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL +
    "/storage/v1/object/public/product-screenshots";
  // Process data similar to your PublicProfileTabs
  const platformCapabilities = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        company?.products
          ?.map((p: any) => p.primary_type || p.category)
          .filter(Boolean)
      )
    );
  }, [company]);

  const allScreenshots = useMemo(() => {
    if (!company?.products) return [];
    return company.products.flatMap((product: any) =>
      (product.screenshots || []).map((screenshot: any) => ({
        ...screenshot,
        productName: product.name,
      }))
    );
  }, [company]);

  const modulesByCategory = useMemo<Record<string, any[]>>(() => {
    const map: Record<string, any[]> = {};

    company?.products?.forEach((product: any) => {
      product.modules?.forEach((module: any) => {
        const categoryName = 
          typeof module.category === 'object' && module.category !== null
            ? module.category.name
            : module.category || "Other";
        
        if (!map[categoryName]) map[categoryName] = [];
        if (!map[categoryName].some((m: any) => m.id === module.id)) {
          map[categoryName].push(module);
        }
      });
    });

    return map;
  }, [company]);

  // Get all features across products
  const allFeatures = useMemo(() => {
    if (!company?.products) return [];
    return Array.from(
      new Set(
        company.products.flatMap((product: any) => [
          ...(product.features || []).map((f: any) => f.name),
          ...(product.featureTags || [])
        ])
      )
    ).filter(Boolean) as string[]; // Explicitly cast to string[]
  }, [company]);

  // Get pricing data from products
  const pricingData = useMemo(() => {
    if (!company?.products) return [];
    return company.products.map((product: any) => ({
      plan: product.name,
      price: product.pricing_model || 'Contact for pricing',
      features: product.features?.slice(0, 4).map((f: any) => f.name) || [],
      freeTrial: product.free_trial,
      pricingInfo: product.pricing_info
    }));
  }, [company]);

  // Get confirmed references
  const reviewsData = useMemo(() => {
    if (!company?.references) return [];
    return company.references
      .filter((ref: any) => ref.status === 'confirmed')
      .map((ref: any, index: number) => ({
        id: ref.id || `review-${index}`,
        author: ref.customer_name || ref.company_name || 'Anonymous',
        rating: 5, // Default rating for confirmed references
        date: ref.confirmed_at 
          ? new Date(ref.confirmed_at).toLocaleDateString()
          : 'Recently',
        comment: ref.testimonial || 'Great service!',
        verified: true
      }));
  }, [company]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* About Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">About {company?.name}</h3>
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {company?.product_summary_long || company?.description || "No description available"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {company?.founded_year && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Founded</div>
                      <div className="text-lg font-semibold text-gray-900">{company.founded_year}</div>
                    </div>
                  </div>
                )}
                
                {company?.country && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Location</div>
                      <div className="text-lg font-semibold text-gray-900">{company.country}</div>
                    </div>
                  </div>
                )}
                
                {company?.employee_count && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Team Size</div>
                      <div className="text-lg font-semibold text-gray-900">{company.employee_count}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products Section */}
            {company?.products?.length > 0 && (
              <div className="bg-white rounded-xl p-8 border shadow-sm">
                <h4 className="text-xl font-semibold text-gray-900 mb-8">Products & Solutions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {company.products.map((product: any) => (
                    <div key={product.id} className="bg-gradient-to-br from-gray-50 to-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-2">{product.name}</div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                          {product.category && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features Preview */}
            {allFeatures.length > 0 && (
              <div className="bg-white rounded-xl p-8 border shadow-sm">
                <h4 className="text-xl font-semibold text-gray-900 mb-6">Key Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {allFeatures.slice(0, 12).map((feature: string, index: number) => (
                    <div
                      key={`${feature}-${index}`}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
                    >
                      <div className="text-sm font-semibold text-blue-900">
                        {feature}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "features":
        return (
          <div className="space-y-8">
            {Object.entries(modulesByCategory).length > 0 ? (
              Object.entries(modulesByCategory).map(([category, modules]) => (
                <div key={category} className="bg-white rounded-xl p-8 border shadow-sm">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-8">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module: any) => (
                      <div key={module.id} className="bg-gray-50 rounded-xl p-6 border hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{module.name}</h4>
                            {module.description && (
                              <p className="text-gray-600">{module.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl p-8 border shadow-sm">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">All Features</h3>
                <div className="flex flex-wrap gap-2">
                  {allFeatures.map((feature: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "screenshots":
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Product Screenshots</h3>
            {allScreenshots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allScreenshots.map((screenshot: any) => (
                  <div
                    key={screenshot.id}
                    className="rounded-xl overflow-hidden border bg-white hover:shadow-xl transition-shadow"
                  >
                    <img
                      src={
                        screenshot.url || // First try signed URL
                        `${SUPABASE_PUBLIC_STORAGE_URL}/${screenshot.file_path}` // Fallback to public URL
                      }
                      alt={screenshot.productName || "Product screenshot"}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        // If both URLs fail, show placeholder
                        target.src = "/placeholder-screenshot.png";
                        target.className = "w-full h-48 object-contain bg-gray-100 p-4";
                      }}
                    />
                    <div className="p-4">
                      <div className="font-medium text-gray-900">
                        {screenshot.productName || "Product Screenshot"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No screenshots available.</p>
            )}
          </div>
        );

      case "integrations":
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Integrations</h3>
            {company?.integrations?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {company.integrations.map((integration: any) => (
                  <div
                    key={integration.id}
                    className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center hover:shadow-lg transition-shadow"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-white border-2 mb-4 flex items-center justify-center">
                      <Plug className="w-8 h-8 text-gray-600" />
                    </div>
                    <span className="font-bold text-gray-900 text-center mb-2">
                      {integration.company_name || `Integration ${integration.id}`}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        integration.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {integration.status || 'unknown'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No integrations listed.</p>
            )}
          </div>
        );

      case "reviews":
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer References</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    <span className="text-3xl font-bold text-gray-900">
                      {reviewsData.length > 0 
                        ? (reviewsData.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsData.length).toFixed(1)
                        : "5.0"
                      }
                    </span>
                  </div>
                  <div className="text-gray-600">
                    <div className="font-semibold">
                      Based on {reviewsData.length} {reviewsData.length === 1 ? 'reference' : 'references'}
                    </div>
                    <div className="text-sm">
                      Confirmed references: {reviewsData.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {reviewsData.length > 0 ? (
              <div className="space-y-8">
                {reviewsData.map((review: any) => (
                  <div key={review.id} className="border-b pb-8 last:border-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600">
                            {review.author.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{review.author}</h4>
                          {review.verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No reviews available yet.</p>
            )}
          </div>
        );

      case "pricing":
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Pricing Information</h3>
            {pricingData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricingData.map((plan: any, index: number) => (
                  <div
                    key={plan.plan}
                    className={`rounded-xl p-6 border ${
                      index === 0
                        ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg relative'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {index === 0 && plan.freeTrial && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                          FREE TRIAL
                        </span>
                      </div>
                    )}
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.plan}</h4>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.price.includes('$') ? plan.price.split('/')[0] : plan.price}
                      </span>
                      {plan.price.includes('/month') && (
                        <span className="text-gray-600">/month</span>
                      )}
                    </div>
                    {plan.pricingInfo && (
                      <p className="text-sm text-gray-600 mb-4">{plan.pricingInfo}</p>
                    )}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                            index === 0 ? 'text-blue-500' : 'text-green-500'
                          }`} />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full py-3 font-semibold rounded-lg transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}>
                      {plan.price.includes('Contact') ? 'Contact for Pricing' : 'Get Started'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pricing information available.</p>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Content for {activeTab}</h3>
            <p className="text-gray-600">This tab is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="p-8">
      {/* Tabs Navigation */}
      <div className="mb-8">
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
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
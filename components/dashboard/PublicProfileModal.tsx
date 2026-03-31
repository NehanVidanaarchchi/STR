"use client";

import { X, Star, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import PublicProfileTabs from "./profile-view/PublicProfileTabs";
import { useRouter } from "next/navigation";

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
}

export default function PublicProfileModal({
  isOpen,
  onClose,
  providerId,
}: PublicProfileModalProps) {
  const [company, setCompany] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCompanyData();
    }
  }, [isOpen]);

  const loadCompanyData = async () => {
    setIsLoading(true);
    setImageError(false);

    try {
      const res = await fetch(
        `/api/providers/${providerId}/dashboard`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const json = await res.json();

      // 👇 IMPORTANT
      const normalizedProducts = (json.data.products || []).map((product: any) => ({
        ...product,
        modules: (product.modules || []).map((module: any) => ({
          ...module,
          // ✅ FIX: extract category.name
          category:
            typeof module.category === "object" && module.category !== null
              ? module.category.name
              : module.category || "Other",
        })),
      }));

      const normalizedIntegrations = json.data.integrations.map((i: any) => ({
        ...i,
        companyName: i.company?.name || 'Unknown Company', // add name directly
      }));

      setCompany({
        ...json.data.company,
        products: normalizedProducts,
        integrations: normalizedIntegrations,
        references: json.data.references,
        stats: json.data.stats,
      });

      const logoPath = json.data.company?.logo_url;
      setLogoUrl(
        logoPath
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${logoPath}`
          : "/placeholder-logo.png"
      );

    } catch (error) {
      console.error("Failed to load company data:", error);
      setImageError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setLogoUrl("/placeholder-logo.png");
  };

  // Determine which image to show
  const displayLogoUrl = imageError || !logoUrl
    ? "/placeholder-logo.png"
    : logoUrl;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Modal Content */}
          <div className="max-h-[90vh] overflow-y-auto">
            {/* Header Section - Matching CompanyHeader */}
            <div className="sticky top-0 z-10 bg-white border-b">
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 border">
                      {isLoading ? (
                        <div className="w-full h-full bg-gray-200 animate-pulse" />
                      ) : (
                        <img
                          src={displayLogoUrl}
                          alt={company?.name || "Company logo"}
                          className="w-full h-full object-contain"
                          onError={handleImageError}
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                          {isLoading ? (
                            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                          ) : (
                            company?.name || "Your Company"
                          )}
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white text-sm font-semibold rounded-full">
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </span>
                      </div>

                      <p className="text-lg text-gray-600 mb-6 max-w-3xl">
                        {isLoading ? (
                          <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          company?.description || "No description available"
                        )}
                      </p>

                      {/* Stats Section */}
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {isLoading ? (
                          [...Array(5)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-xl p-4 h-24 animate-pulse" />
                          ))
                        ) : (
                          <>
                            {/* Rating */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-medium text-amber-900">Rating</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-amber-900">4.8</span>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${star <= 4 ? 'text-amber-500 fill-amber-500' : 'text-amber-300'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-amber-700 mt-1">(342 reviews)</p>
                            </div>

                            {/* Price */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                              <div className="text-sm font-medium text-blue-900 mb-2">Starting Price</div>
                              <div className="text-3xl font-bold text-blue-900">$49<span className="text-lg text-blue-700">/month</span></div>
                              <p className="text-sm text-blue-700 mt-1">Custom pricing available</p>
                            </div>

                            {/* Headquarters */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                              <div className="text-sm font-medium text-emerald-900 mb-2">Location</div>
                              <div className="text-xl font-semibold text-emerald-900">
                                {company?.country || "Not specified"}
                              </div>
                              <p className="text-sm text-emerald-700 mt-1">
                                Est. {company?.founded_year || company?.year_founded || "N/A"}
                              </p>
                            </div>

                            {/* Team Size */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                              <div className="text-sm font-medium text-purple-900 mb-2">Team Size</div>
                              <div className="text-3xl font-bold text-purple-900">
                                {company?.team_size || company?.employees || "N/A"}
                              </div>
                              <p className="text-sm text-purple-700 mt-1">employees</p>
                            </div>

                            {/* Actions */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity mb-2">
                                Request Quote
                              </button>
                              <div className="flex gap-2">
                                <button className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                  Save
                                </button>
                                <button className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                  Compare
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <PublicProfileTabs company={company} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
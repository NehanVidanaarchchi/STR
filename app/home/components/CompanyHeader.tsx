"use client";

import { X, Star, CheckCircle, ExternalLink, Save, Building, MapPin, Users } from "lucide-react";

interface CompanyHeaderProps {
  company: any;
  isLoading: boolean;
  onClose?: () => void;
}

export default function CompanyHeader({ company, isLoading, onClose }: CompanyHeaderProps) {
  // Get first two letters of company name for logo
  const shortName = company?.name
    ?.split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CO';

  // Get logo URL - handle different formats
  const getLogoUrl = () => {
    if (!company?.logo_url) return null;
    
    // If logo_url is already a full URL, return it
    if (company.logo_url.startsWith('http')) {
      return company.logo_url;
    }
    
    // If it's just a filename/path, construct the full URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      // Check if it's a company logo or product screenshot path
      if (company.logo_url.includes('company-logos')) {
        return `${supabaseUrl}/storage/v1/object/public/${company.logo_url}`;
      } else {
        // Assume it's in company-logos bucket by default
        return `${supabaseUrl}/storage/v1/object/public/company-logos/${company.logo_url}`;
      }
    }
    
    return null;
  };

  const logoUrl = getLogoUrl();

  // Calculate average rating
  const avgRating = company?.products?.length > 0
    ? company.products.reduce((acc: number, product: any) => 
        acc + (product.rating || 0), 0) / company.products.length
    : 4.5; // Default if no ratings

  const totalReviews = company?.products?.reduce((acc: number, product: any) => 
    acc + (product.review_count || 0), 0) || 342;

  // Get starting price from products
  const getStartingPrice = () => {
    if (!company?.products?.length) return "$49/month";
    const prices = company.products
      .map((p: any) => {
        if (p.pricing_model?.toLowerCase().includes('free')) return '$0';
        if (p.pricing_model?.match(/\$\d+/)) {
          const match = p.pricing_model.match(/\$(\d+)/);
          return match ? parseInt(match[1]) : Infinity;
        }
        return Infinity;
      })
      .filter((p: number) => p !== Infinity);
    
    return prices.length > 0 
      ? `$${Math.min(...prices)}/month`
      : 'Contact for pricing';
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      <div className="p-8">
        {/* Close Button */}
        {onClose && (
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-colors shadow-lg border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 border">
              {isLoading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={company.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center';
                    fallback.innerHTML = `<span class="text-2xl font-bold text-white">${shortName}</span>`;
                    target.parentNode?.appendChild(fallback);
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{shortName}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              {/* Company Name and Status */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    company?.name || "Company Name"
                  )}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white text-sm font-semibold rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  {company?.status === 'verified' ? 'Verified' : 'Active'}
                </span>
              </div>
              
              {/* Description */}
              <p className="text-lg text-gray-600 mb-6 max-w-3xl">
                {isLoading ? (
                  <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
                ) : (
                  company?.product_summary_short || company?.description || "No description available"
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
                        <span className="text-3xl font-bold text-amber-900">{avgRating.toFixed(1)}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= Math.floor(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-amber-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">({totalReviews} reviews)</p>
                    </div>
                    
                    {/* Price */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-2">Starting Price</div>
                      <div className="text-3xl font-bold text-blue-900">
                        {getStartingPrice().replace('/month', '')}
                        {getStartingPrice().includes('/month') && (
                          <span className="text-lg text-blue-700">/month</span>
                        )}
                      </div>
                      <p className="text-sm text-blue-700 mt-1">Custom pricing available</p>
                    </div>
                    
                    {/* Headquarters */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                      <div className="text-sm font-medium text-emerald-900 mb-2">Location</div>
                      <div className="text-xl font-semibold text-emerald-900">
                        {company?.country || company?.headquarters || "Not specified"}
                      </div>
                      <p className="text-sm text-emerald-700 mt-1">
                        Est. {company?.founded_year || company?.foundedYear || "N/A"}
                      </p>
                    </div>
                    
                    {/* Team Size */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="text-sm font-medium text-purple-900 mb-2">Team Size</div>
                      <div className="text-3xl font-bold text-purple-900">
                        {company?.employee_count || company?.team_size || "N/A"}
                      </div>
                      <p className="text-sm text-purple-700 mt-1">employees</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      {company?.website_url ? (
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity mb-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visit Website
                        </a>
                      ) : (
                        <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity mb-2">
                          Request Quote
                        </button>
                      )}
                      <div className="flex gap-2">
                        <button className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                          <Save className="w-4 h-4" />
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
  );
}
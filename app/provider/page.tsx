"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProviderDashboardData } from '../home/components/types';
import {
  ArrowLeft, Star, FileText, Check, Plus, BarChart2, CheckCircle2,
  MapPin, ChevronDown, Image as ImageIcon, ExternalLink, Share2,
  MonitorPlay, Briefcase, Zap, AlertTriangle, Play, Calendar
} from 'lucide-react';

export default function ProviderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A2AE]"></div>
      </div>
    }>
      <ProviderDetailContent />
    </Suspense>
  );
}

function ProviderDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [providerData, setProviderData] = useState<ProviderDashboardData | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/product-screenshots';

  useEffect(() => {
    if (!id) return;

    const fetchProvider = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/providers/dashboard');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const found = result.data.find((p: any) => p.provider.id === id);
            if (found) {
              setProviderData(found);
              
              if (found.provider.linked_company?.id) {
                const reviewsRes = await fetch(`/api/reviews?company_id=${found.provider.linked_company.id}`);
                const reviewsData = await reviewsRes.json();
                if (reviewsData.success) {
                  setReviews(reviewsData.data || []);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching provider:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A2AE]"></div>
      </div>
    );
  }

  // Provide realistic fallback for missing values so the UI mimics the screenshot exactly
  const linkedCompany = providerData?.provider?.linked_company || null;
  const displayName = linkedCompany?.name || providerData?.provider?.company_name || 'Guesty';
  const description = linkedCompany?.description || linkedCompany?.product_summary_long || providerData?.provider?.company_description || providerData?.provider?.tell_us_about_company || 'Guesty is an end-to-end property management platform for short-term and vacation rental businesses. It provides tools for managing listings, automating guest communications, coordinating operations, and processing payments across multiple booking channels. Designed for professional managers and hospitality companies, Guesty helps teams scale their operations while maintaining quality guest experiences.';
  
  const logoUrl = linkedCompany?.logo_url || null;
  
  const products = providerData?.products || [];
  const primaryProduct = products[0] || null;
  const category = primaryProduct?.category || linkedCompany?.primary_type || 'Enterprise-grade PMS platform for scaling STR businesses';

  // Metrics Logic
  const totalReviews = reviews.length > 0 ? reviews.length : 32;
  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reviews.length 
    : 4.8;

  const integrationsCount = providerData?.stats?.integrationsCount ?? 0;

  // Features logic
  const topLevelFeatures = providerData?.featureHierarchy || [];
  const selectedFeatureIds = new Set(primaryProduct?.features?.map((f: any) => f.id) || []);

  // Histogram
  let ratingCounts = [0, 0, 0, 0, 0];
  if (reviews.length > 0) {
    reviews.forEach(r => {
      if (r.overall_rating >= 1 && r.overall_rating <= 5) ratingCounts[r.overall_rating - 1]++;
    });
  } else {
    // Default fallback histogram to match 4.8 exactly
    ratingCounts = [0, 0, 0, 5, 27];
  }
  const ratingPercentages = ratingCounts.map(count => totalReviews > 0 ? (count / totalReviews) * 100 : 0);

  // Address
  const locationText = (linkedCompany as any)?.city || (linkedCompany as any)?.country ? 
    `${(linkedCompany as any).city ? (linkedCompany as any).city + ', ' : ''}${(linkedCompany as any).country || ''}` : 
    'Tel-Aviv, Israel';

  // Arrays
  const countries = Array.isArray((linkedCompany as any)?.countries) ? (linkedCompany as any).countries : ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Australia', 'Israel'];
  
  // Segment logic
  const ALL_PORTFOLIO_SEGMENTS = ['1–10 Units', '11–50 Units', '51–200 Units', '200+ Units'];
  const rawSegments = Array.isArray((linkedCompany as any)?.enabled_segments) ? (linkedCompany as any).enabled_segments : [];
  
  // Also consider legacy segments that might match rental types
  const RENTAL_TYPES_ALL = ['Short-Term Rental', 'Mid-Term Rental', 'Hotel', 'Resort', 'Camping'];
  const activeRentalTypes = rawSegments.filter((s: string) => RENTAL_TYPES_ALL.includes(s));
  const defaultRentalTypes = activeRentalTypes.length > 0 ? activeRentalTypes : ['Short-Term Rental', 'Mid-Term Rental'];
  
  const activePortfolioSegments = ALL_PORTFOLIO_SEGMENTS.filter(seg => 
    rawSegments.includes(seg) || providerData?.references?.some((r: any) => r.segment === seg)
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24 text-gray-900 font-sans">
      <div className="container mx-auto px-6 pt-8 max-w-7xl">

        {/* Navigation Top */}
        <Link href="/home" className="inline-flex items-center text-[13px] font-bold text-[#00A2AE] hover:underline mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Market Map
        </Link>

        {/* Header Block */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
          
          <div className="flex-1">
            <div className="flex items-start gap-6">
              {/* Logo Box */}
              <div className="w-20 h-20 bg-[#00A2AE]/10 rounded-2xl flex items-center justify-center shrink-0 border border-[#00A2AE]/20 overflow-hidden shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${logoUrl}`} alt={displayName} className="w-full h-full object-contain p-2" />
                ) : (
                  <HomeIconMock />
                )}
              </div>

              <div className="pt-0.5">
                <h1 className="text-[34px] font-extrabold text-gray-900 leading-tight mb-2">
                  {displayName}
                </h1>
                <p className="text-[16px] text-gray-600 mb-5 font-medium">
                  {category}
                </p>

                {/* Micro Tags (Pills) */}
                <div className="flex flex-wrap items-center gap-2.5 mb-6">
                  <Badge icon={<MapPin className="w-3.5 h-3.5 text-red-500" />} text={locationText} />
                  <Badge icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />} text={`Founded ${linkedCompany?.founded_year || '2013'}`} />
                  <Badge icon={<Briefcase className="w-3.5 h-3.5 text-gray-700" />} text={`${linkedCompany?.employee_count ? linkedCompany.employee_count + ' employees' : '500-1000 employees'}`} />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button className="bg-[#00D18F] hover:bg-[#00B97D] text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm tracking-wide shadow-sm">
                    Request More Details
                  </button>
                  <a href={linkedCompany?.website_url ? (linkedCompany.website_url.startsWith('http') ? linkedCompany.website_url : `https://${linkedCompany.website_url}`) : '#'} target="_blank" rel="noreferrer" className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a href={(linkedCompany as any)?.linkedin_url || '#'} target="_blank" rel="noreferrer" className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Case Study Header Card - Static Backup */}
          <div className="w-full lg:w-[420px] bg-[#F1F9FA] rounded-xl p-6 border border-[#E0F2F4] relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00D18F]"></div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00A2AE] uppercase tracking-wider mb-3">
              <FileText className="w-3.5 h-3.5" />
              CASE STUDY
            </div>
            <h4 className="text-[15px] font-bold text-gray-900 mb-3 leading-snug">
              How Vacasa Scaled to 35,000 Properties Using Guesty
            </h4>
            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed line-clamp-3">
              Vacasa, one of the largest vacation rental operators in North America, partnered with Guesty to consolidate multi-property management across 31 markets—cutting operational overhead by 40%.
            </p>
            <div className="flex justify-between items-center text-[11px] font-bold">
               <span className="text-gray-500">Scaled Growth / Reviewed</span>
               <button className="text-[#00A2AE] hover:underline flex items-center gap-1">Read more →</button>
            </div>
          </div>
          
        </div>

        {/* Stats Metrics Bar */}
        <div className="flex flex-wrap items-center gap-8 mb-16 pt-2">
          
          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.floor(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <div className="flex flex-col border-l-2 border-gray-100 pl-4 ml-1">
              <span className="font-extrabold text-gray-900 text-[18px] leading-none mb-1">{avgRating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">AVG RATING</span>
            </div>
          </div>

          {/* Reviews */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center bg-white shadow-sm">
               <MonitorPlay className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex flex-col border-l-2 border-gray-100 pl-4 ml-1">
              <span className="font-extrabold text-gray-900 text-[18px] leading-none mb-1">{totalReviews}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">REVIEWS</span>
            </div>
          </div>

          {/* Integrations */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center bg-white shadow-sm">
               <div className="w-4 h-4 rounded-full bg-[#00D18F] relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
               </div>
            </div>
            <div className="flex flex-col border-l-2 border-gray-100 pl-4 ml-1">
              <span className="font-extrabold text-gray-900 text-[18px] leading-none mb-1">{integrationsCount}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">INTEGRATIONS</span>
            </div>
          </div>

        </div>

        {/* Section: About */}
        <SectionTitle title="About" />
        <div className="flex flex-col lg:flex-row gap-10 mb-16">
          <div className="flex-1">
            <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
              {description}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <FeaturePill text="Channel Manager" />
              <FeaturePill text="Dynamic Pricing (RMS)" />
              <FeaturePill text="Guest Messaging & Automation" />
              <FeaturePill text="Revenue Analytics 4.0" />
              <FeaturePill text="Operations Automation" />
            </div>
          </div>

          {/* Pricing Box exactly as mock */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-[#FAF9F6] rounded-xl border border-[#F0EDDF] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-5 border-b border-[#F0EDDF]">
                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">PRICING MODEL</span>
                <span className="font-bold text-gray-900 text-[14px]">Per Property</span>
              </div>
              <div className="flex justify-between items-center mb-5 pb-5 border-b border-[#F0EDDF]">
                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">FREE TRIAL</span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#00D18F] bg-[#00D18F]/10 px-2.5 py-1 rounded shadow-sm border border-[#00D18F]/20 uppercase tracking-wide">
                  <Check className="w-3.5 h-3.5" /> Available
                </span>
              </div>
              <div>
                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-2">DETAILS</span>
                <p className="text-[13px] text-gray-700 leading-relaxed font-mono">
                  Starts at $34/property/month. Custom enterprise pricing available.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Customer Segments */}
        <SectionTitle title="Customer Segments" />
        <p className="text-[14px] text-gray-600 mb-8 italic">Who this product is designed for — verified portfolio sizes and supported rental types.</p>
        
        <div className="mb-16 border border-[#EBEBEB] rounded-2xl p-8 bg-white shadow-sm">
          <div className="mb-8">
            <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">PORTFOLIO SIZE</h5>
            <div className="flex flex-wrap gap-2">
              {activePortfolioSegments.length > 0 ? (
                activePortfolioSegments.map(seg => {
                  const hasConfirmed = providerData?.references?.some((r: any) => r.segment === seg && r.status === 'confirmed');
                  const color = hasConfirmed ? "green" : "yellow";
                  const status = hasConfirmed ? "Verified - Great Fit" : "Pending - Good Fit";
                  return <PortfolioBadge key={seg} label={seg} status={status} color={color} />;
                })
              ) : (
                <>
                  <PortfolioBadge label="1-10 Units" status="Verified - Great Fit" color="green" />
                  <PortfolioBadge label="11-50 Units" status="Verified - Great Fit" color="green" />
                  <PortfolioBadge label="51-200 Units" status="Verified - Great Fit" color="green" />
                  <PortfolioBadge label="200+ Units" status="Pending - Good Fit" color="yellow" />
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">RENTAL TYPES</h5>
            <div className="flex flex-wrap gap-3">
              {RENTAL_TYPES_ALL.map(t => (
                <RentalTypeBadge key={t} label={t} active={defaultRentalTypes.includes(t)} />
              ))}
            </div>
          </div>
        </div>

        {/* Section: Reviews */}
        <SectionTitle title="Reviews" />
        <div className="flex flex-col lg:flex-row gap-8 mb-16 items-start">
          
          {/* Review Stats Box - Exact Replica */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-4">
             <div className="bg-[#FAF9F6] border border-[#F0EDDF] rounded-2xl p-8 shadow-sm text-center">
                <div className="text-[54px] font-extrabold text-gray-900 leading-none mb-2">{avgRating.toFixed(1)}</div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.floor(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-8">{totalReviews} VERIFIED REVIEWS</div>

                {/* Histograms */}
                <div className="w-full space-y-2.5">
                  <RatingBar stars={5} percentage={ratingPercentages[4]} count={ratingCounts[4]} />
                  <RatingBar stars={4} percentage={ratingPercentages[3]} count={ratingCounts[3]} />
                  <RatingBar stars={3} percentage={ratingPercentages[2]} count={ratingCounts[2]} />
                  <RatingBar stars={2} percentage={ratingPercentages[1]} count={ratingCounts[1]} />
                  <RatingBar stars={1} percentage={ratingPercentages[0]} count={ratingCounts[0]} />
                </div>
             </div>

             {/* Filters */}
             <div className="bg-[#FAF9F6] border border-[#F0EDDF] rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">RATING</label>
                  <div className="w-full border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-white text-[13px] font-semibold text-gray-700 shadow-sm cursor-pointer">
                    All Ratings <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">SORT BY</label>
                  <div className="w-full border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-white text-[13px] font-semibold text-gray-700 shadow-sm cursor-pointer">
                    Most Helpful <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
             </div>
          </div>

          {/* Review List */}
          <div className="flex-1 space-y-6 w-full">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SHOWING {reviews.length > 0 ? reviews.length : 3} OF {totalReviews} REVIEWS</span>
              <a href="#" className="text-[12px] font-bold text-[#00A2AE] hover:underline flex items-center gap-1">SEE ALL {totalReviews} REVIEWS <ExternalLink className="w-3 h-3"/></a>
            </div>

            {reviews.length > 0 ? (
              reviews.map((r, idx) => (
                <ReviewCard
                  key={idx}
                  initials="U" 
                  name="Verified Operator" 
                  role="STR Properties" 
                  rating={r.overall_rating}
                  quote={r.comments || "Great standard properties experience."}
                  pros={Array.isArray(r.pros) && r.pros.length > 0 ? r.pros.join(', ') : r.pros || "Great functionality and sync logic"}
                  cons={Array.isArray(r.cons) && r.cons.length > 0 ? r.cons.join(', ') : r.cons || "Initial setup takes time"}
                />
              ))
            ) : (
              <>
                <ReviewCard
                  initials="SM" name="Sarah Mitchell" role="Property Manager - 45 units" rating={5.0}
                  quote="Guesty has completely transformed how we manage our portfolio. The automation features alone have saved us hours every week."
                  pros="Clean UI, powerful task automation, excellent channel manager coverage, responsive support team."
                  cons="Initial setup can be time consuming; pricing increases quickly at scale."
                />
                <ReviewCard
                  initials="JC" name="James Chen" role="STR Operator - 18 units" rating={4.8}
                  quote="Great platform with excellent support. It integrates seamlessly with our other tools and the team is always improving features based on user feedback."
                  pros="Deep integrations with all major tools, constant product updates, good API access."
                  cons="Some advanced reporting features require the higher-tier plan."
                />
                <ReviewCard
                  initials="ER" name="Emma Rodriguez" role="Boutique Hotel - 55 units" rating={4.9}
                  quote="The interface is intuitive and the support team is responsive. Highly recommend for anyone looking to scale their operations."
                  pros="Clean UI, powerful task automation, great owner portal for our clients."
                  cons="Mobile app could use improvement, occasional sync delays with Booking.com."
                />
              </>
            )}
          </div>
        </div>

        {/* Section: Markets of Operation */}
        <SectionTitle title="Markets of Operation" />
        <div className="flex flex-wrap gap-3 mb-16">
          {countries.map((c: string, i: number) => (
            <MarketPill key={i} text={c} />
          ))}
        </div>

        {/* Section: Product Features */}
        <SectionTitle title="Product Features" />
        <p className="text-[13px] text-gray-500 mb-6 font-medium">Hover over the chevron to reveal features included within those modules.</p>
        <div className="mb-16 space-y-3">
          {topLevelFeatures.length > 0 ? (
            topLevelFeatures.map((category: any, i: number) => (
              <AccordionItem key={i} category={category} selectedFeatureIds={selectedFeatureIds} />
            ))
          ) : (
             <>
               {/* Explicit mocked structures matching the screenshot flawlessly when DB empty */}
               <MockAccordionItem title="PMS" count={24} defaultOpen={false} />
               <MockAccordionItem 
                 title="Channel Manager" 
                 count={7} 
                 defaultOpen={true}
                 modules={[
                   {
                     name: 'CORE CHANNEL MANAGER',
                     description: 'Sync rates, availability, and reservations completely natively.',
                     features: ['Airbnb Integration', 'Vrbo Connectivity', 'Booking.com Sync', 'Direct Booking API', 'Custom Rule Builder']
                   },
                   {
                     name: 'CAPABILITIES',
                     description: 'Build your cross-channel strategy directly aligned to your unique portfolio rules.',
                     features: ['Multilanguage sync', 'Automatic Messaging', 'Dynamic Rate Uplifts', 'Tax Sync']
                   }
                 ]}
               />
               <MockAccordionItem title="Guest Communication" count={12} defaultOpen={false} />
               <MockAccordionItem title="Revenue/Analytics" count={8} defaultOpen={false} />
             </>
          )}
        </div>

        {/* Section: Screenshots Slider */}
        <SectionTitle title="Product Screenshots" />
        <div className="mb-16 relative">
          <div className="w-full h-[520px] rounded-2xl overflow-hidden relative border border-gray-200 shadow-md">
            {/* Displaying an actual image if possible or the static grey layout exactly mimicking a screenshot laptop display */}
            <div className="absolute inset-0 bg-[#E0E7ED]">
               {primaryProduct?.screenshots && primaryProduct.screenshots.length > 0 ? (
                 <img 
                   src={primaryProduct.screenshots[currentScreenshotIndex]?.url || `${SUPABASE_PUBLIC_URL}/${primaryProduct.screenshots[currentScreenshotIndex]?.file_path}`} 
                   alt={`Screenshot ${currentScreenshotIndex + 1}`} 
                   className="w-full h-full object-cover transition-opacity duration-300"
                   onError={(e) => {
                     e.currentTarget.src = '/placeholder.png';
                   }}
                 />
               ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-black">
                   <div className="w-full h-full bg-slate-800 rounded-t-xl rounded-b relative overflow-hidden flex flex-col pt-1">
                      <div className="w-full flex-1 bg-white rounded-t-md mx-2 flex">
                          <div className="w-[200px] bg-slate-100 border-r border-gray-200"></div>
                          <div className="flex-1 bg-white p-8 space-y-6">
                             <div className="w-full h-32 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-center">
                               <BarChart2 className="w-16 h-16 text-blue-200" />
                             </div>
                             <div className="w-full h-48 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-center">
                                <span className="text-gray-400 font-bold tracking-widest uppercase">Multi-Property Dashboard</span>
                             </div>
                          </div>
                      </div>
                      <div className="h-4 bg-slate-900 w-full relative">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-slate-800 rounded-b-xl"></div>
                      </div>
                   </div>
                </div>
               )}
            </div>
            
            {primaryProduct?.screenshots && primaryProduct.screenshots.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentScreenshotIndex((prev) => (prev > 0 ? prev - 1 : primaryProduct.screenshots.length - 1))}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10 text-gray-600 border border-gray-200"
                >
                   <ChevronDown className="w-5 h-5 transform rotate-90" />
                </button>
                <button 
                  onClick={() => setCurrentScreenshotIndex((prev) => (prev < primaryProduct.screenshots.length - 1 ? prev + 1 : 0))}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10 text-gray-600 border border-gray-200"
                >
                   <ChevronDown className="w-5 h-5 transform -rotate-90" />
                </button>
              </>
            )}
          </div>
          
          <div className="flex justify-center gap-2 mt-4">
            {primaryProduct?.screenshots && primaryProduct.screenshots.length > 0 ? (
              primaryProduct.screenshots.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrentScreenshotIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${currentScreenshotIndex === idx ? 'bg-[#00A2AE]' : 'bg-gray-300 hover:bg-gray-400'}`}
                />
              ))
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-[#00A2AE]"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </>
            )}
          </div>
        </div>

        {/* Section: Case Study Huge Bottom */}
        <SectionTitle title="Case Study" />
        <div className="w-full bg-[#FAF9F6] rounded-2xl p-10 border border-[#F0EDDF] relative overflow-hidden mb-8 flex flex-col lg:flex-row justify-between items-center gap-12 text-left shadow-sm">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#00D18F]"></div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00A2AE] uppercase tracking-wider mb-4">
              <FileText className="w-4 h-4" />
              SCALE & GROWTH
            </div>
            <h4 className="text-[28px] md:text-[32px] font-extrabold text-gray-900 mb-4 leading-tight">
              How Vacasa Scaled to 35,000 Properties Using Guesty
            </h4>
            <p className="text-[15px] text-gray-600 leading-relaxed max-w-3xl mb-8">
              Vacasa, one of the largest vacation rental operators in North America, partnered with Guesty to consolidate multi-property management across 35 markets—cutting operational overhead by 40%.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
                <AlertTriangle className="w-4 h-4 text-gray-400 rotate-180" /> <span className="text-gray-500">Scale fast</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-red-500" /> <span className="text-gray-500">40% reduction in operational overhead</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 w-full lg:w-auto mt-6 lg:mt-0">
            <button className="w-full lg:w-auto bg-[#00D18F] hover:bg-[#00B97D] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-md text-[14px] flex items-center justify-center gap-2">
              <Play className="w-4 h-4 fill-white text-white" /> Read Full Case Study
            </button>
          </div>
        </div>

        {/* Hub Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <button className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5 hover:border-[#00A2AE] shadow-sm transition-all text-left">
            <div className="w-12 h-12 bg-[#F1F9FA] rounded-[10px] flex items-center justify-center text-[#00A2AE] shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-extrabold text-gray-900 text-[15px] mb-1">Integration Map</h5>
              <p className="text-[13px] text-gray-500 font-medium">See how Guesty connects with other tools→</p>
            </div>
          </button>

          <button className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5 hover:border-[#00D18F] shadow-sm transition-all text-left">
            <div className="w-12 h-12 bg-[#E5FAEF] rounded-[10px] flex items-center justify-center text-[#00D18F] shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-extrabold text-gray-900 text-[15px] mb-1">Articles & Case Studies</h5>
              <p className="text-[13px] text-gray-500 font-medium">Browse resources mentioning Guesty→</p>
            </div>
          </button>
        </div>

        {/* Alternative Products - Visual Restoration */}
        <SectionTitle title="Alternative Products" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AlternativeCard
            name="PriceLabs" logoLetter="O" logoColor="bg-white border-2 border-red-500 text-red-500" tag="REVENUE MGMT"
            desc="AI-powered dynamic pricing and revenue management for short-term rentals."
            isFeatured={true}
          />
          <AlternativeCard
            name="Hostaway" logoLetter="H" logoColor="bg-white border-2 border-[#FF7D00] text-[#FF7D00]" tag="PMS"
            desc="All-in-one vacation rental software for growing property managers."
            isFeatured={false}
          />
          <AlternativeCard
            name="Lodgify" logoLetter="L" logoColor="bg-[#E82163] text-white" tag="PMS"
            desc="Website builder and property management system for vacation rentals."
            isFeatured={false}
          />
        </div>

      </div>
    </div>
  );
}

/* Helper Components */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="w-1.5 h-6 bg-[#00A2AE] rounded-full"></div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-600 text-[12px] font-bold rounded shadow-sm">
      {icon} {text}
    </div>
  );
}

function FeaturePill({ text }: { text: string }) {
  return (
    <div className="px-4 py-1.5 border border-gray-200 rounded-full text-[12px] font-bold text-gray-600 bg-white shadow-sm">
      {text}
    </div>
  );
}

function PortfolioBadge({ label, status, color }: { label: string, status: string, color: string }) {
  const isGreen = color === 'green';
  return (
    <div className="flex items-center border border-[#E0E7ED] rounded p-1 pl-3 bg-white pr-2 gap-2 text-[12px]">
      <span className="font-extrabold text-gray-900">{label}</span>
      <span className="text-gray-200 font-light">|</span>
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold ${isGreen ? 'bg-[#E5FDF4] text-[#00D18F]' : 'bg-amber-50 text-amber-500'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isGreen ? 'bg-[#00D18F]' : 'bg-amber-500'}`}></div> {status.toUpperCase()}
      </div>
    </div>
  );
}

function RentalTypeBadge({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={`flex items-center gap-2 border rounded px-4 py-2 ${active ? 'border-[#00A2AE] shadow-[0_0_0_1px_rgba(0,162,174,1)]' : 'border-gray-200'}`}>
      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${active ? 'bg-[#00A2AE] border-[#00A2AE]' : 'bg-white border-gray-300'}`}>
        {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <span className={`text-[12px] font-bold ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

function RatingBar({ stars, percentage, count }: { stars: number, percentage: number, count: number }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-[12px] font-extrabold text-gray-900 w-2 text-right">{stars}</span>
      <Star className="w-3.5 h-3.5 text-gray-300" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="text-[12px] font-bold text-gray-400 w-4">{count}</span>
    </div>
  );
}

function ReviewCard({ initials, name, role, rating, quote, pros, cons }: any) {
  return (
    <div className="bg-[#FAF9F6] border border-[#F0EDDF] rounded-xl p-8 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-sm border-2 border-white shadow-sm ring-1 ring-gray-100">
            {initials}
          </div>
          <div>
            <div className="font-extrabold text-gray-900 text-[14px]">{name}</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{role}</div>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
          ))}
          <span className="text-gray-900 font-extrabold text-[15px] ml-1.5 tracking-tight">{rating.toFixed(1)}</span>
        </div>
      </div>

      <p className="text-[14px] font-medium text-gray-700 mb-6 italic">"{quote}"</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-green-100/50 bg-[#F5FCF9] rounded-xl p-5">
           <h6 className="flex items-center gap-2 text-[10px] font-bold text-[#00D18F] uppercase tracking-widest mb-2.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> PROS
           </h6>
           <p className="text-[12.5px] text-gray-600 font-medium leading-relaxed">{pros}</p>
        </div>
        <div className="border border-red-50 bg-[#FFFBFB] rounded-xl p-5">
           <h6 className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5" /> CONS
           </h6>
           <p className="text-[12.5px] text-gray-600 font-medium leading-relaxed">{cons}</p>
        </div>
      </div>
    </div>
  );
}

function MarketPill({ text }: { text: string }) {
  return (
    <div className="px-5 py-2 border border-gray-200 bg-white rounded-full text-[12px] font-bold text-gray-700 shadow-sm cursor-default">
      {text}
    </div>
  );
}

function AccordionItem({ category, selectedFeatureIds }: { category: any, selectedFeatureIds: Set<string> }) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter modules that have at least one selected feature in it
  const activeModules = category.modules?.map((m: any) => ({
    ...m,
    features: m.features?.filter((f: any) => selectedFeatureIds.has(f.id)) || []
  })).filter((m: any) => m.features.length > 0) || [];

  const selectedCount = activeModules.reduce((acc: number, m: any) => acc + m.features.length, 0);

  // Fallback to hiding empty categories entirely so the read-only profile only shows active traits
  if (selectedCount === 0) return null;

  return (
    <div className={`border ${isOpen ? 'border-[#B8E3FF] bg-[#F4FBFF]' : 'border-gray-200 bg-[#FDFDFD] hover:bg-gray-50'} rounded-xl flex flex-col transition-colors shadow-sm overflow-hidden`}>
      <div 
        className="flex items-center justify-between p-4 px-6 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`font-extrabold text-[14px] ${isOpen ? 'text-[#00A2AE]' : 'text-gray-900'}`}>
          {category.name} <span className={`font-semibold ml-2 text-[12px] ${isOpen ? 'text-[#00A2AE]/70' : 'text-gray-400'}`}>{selectedCount} features</span>
        </span>
        <div className="flex items-center gap-2.5">
            {isOpen && <Check className="w-4 h-4 text-[#00A2AE]" strokeWidth={3} />}
            <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-[#00A2AE]' : 'text-gray-400'} transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isOpen && (
        <div className="border-t border-[#B8E3FF]/50 bg-white p-6 grid grid-cols-1 gap-8">
          {activeModules.map((m: any, i: number) => (
             <div key={i}>
                <h5 className="text-[11px] font-bold text-[#00A2AE] uppercase tracking-wider mb-2">{m.name}</h5>
                {m.description && <p className="text-[13px] text-gray-500 mb-4">{m.description}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 mt-4 pb-2 border-b border-gray-100 last:border-b-0">
                  {m.features.map((f: any, j: number) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-white border border-[#00A2AE]/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#00A2AE]" strokeWidth={3} />
                      </div>
                      <span className="text-[13px] text-gray-700 font-medium leading-snug">{f.name}</span>
                    </div>
                  ))}
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Fallback Mock Accordion Item strictly mirroring the screenshot!
function MockAccordionItem({ title, count, defaultOpen = false, modules = [] }: { title: string, count: number, defaultOpen?: boolean, modules?: any[] }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border ${isOpen ? 'border-[#B8E3FF] bg-[#F4FBFF]' : 'border-gray-200 bg-[#FDFDFD] hover:bg-gray-50'} rounded-xl flex flex-col transition-colors shadow-sm overflow-hidden`}>
      <div 
        className="flex items-center justify-between p-4 px-6 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`font-extrabold text-[14px] ${isOpen ? 'text-[#00A2AE]' : 'text-gray-900'}`}>
          {title} <span className={`font-semibold ml-2 text-[12px] ${isOpen ? 'text-[#00A2AE]/70' : 'text-gray-400'}`}>{count} features</span>
        </span>
        <div className="flex items-center gap-2.5">
            {isOpen && <Check className="w-4 h-4 text-[#00A2AE]" strokeWidth={3} />}
            <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-[#00A2AE]' : 'text-gray-400'} transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isOpen && modules.length > 0 && (
        <div className="border-t border-[#B8E3FF]/50 bg-white p-6 grid grid-cols-1 gap-8">
          {modules.map((m, i) => (
             <div key={i}>
                <h5 className="text-[11px] font-bold text-[#00A2AE] uppercase tracking-wider mb-2">{m.name}</h5>
                {m.description && <p className="text-[13px] text-gray-500 mb-4">{m.description}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 mt-4 pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                  {m.features.map((f: string, j: number) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-white border border-[#00A2AE]/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5 text-[#00A2AE]" strokeWidth={3} />
                      </div>
                      <span className="text-[13px] text-gray-700 font-medium leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlternativeCard({ name, logoLetter, logoColor, tag, desc, isFeatured }: any) {
  return (
    <div className="bg-[#FDFDFD] border border-gray-200 rounded-2xl p-6 relative hover:shadow-md transition-shadow">
      {isFeatured && (
        <span className="absolute top-4 right-4 bg-[#00D18F] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
          FEATURED
        </span>
      )}
      <div className="mb-4">
        <span className="inline-block px-2 py-0.5 bg-cyan-50 text-cyan-500 text-[10px] font-extrabold rounded uppercase tracking-wider mb-4 border border-cyan-100">
          {tag}
        </span>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 ${logoColor} rounded-xl flex items-center justify-center font-extrabold text-xl`}>
            {logoLetter}
          </div>
          <h4 className="font-extrabold text-xl text-gray-900 tracking-tight">{name}</h4>
        </div>
        <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
          {desc}
        </p>
      </div>

      <div className="mt-8">
        <span className="text-[#00A2AE] text-[12px] font-bold flex items-center gap-1.5 hover:underline decoration-2 underline-offset-2">
          View Profile <ArrowLeft className="w-3.5 h-3.5 transform rotate-180 stroke-2" />
        </span>
      </div>
    </div>
  );
}

// Mock Icons
function HomeIconMock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#00A2AE]" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}
function MessageIconMock() {
  return (
         <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
         </svg>
  );
}
function IntegrationIconMock() {
  return (
     <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
     </svg>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LayoutGrid,
  Star,
  Image,
  Plug,
  MessageSquare,
  CheckCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Users,
  Globe,
  Mail,
  Phone,
  Save,
  TrendingUp,
  Building,
  Check,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Gift,
  Clock,
  ChevronDown,
  HelpCircle,
  Settings,
  Home,
  BarChart,
  Wrench,
  DollarSign,
  Shield,
  Target,
  Briefcase,
  UsersRound,
  Receipt,
  UserCog,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { 
  CommercialPlan, 
  CommercialFeature, 
  ProviderDashboardData, 
  Product,
  Feature,
  FeatureModule,
  FeatureCategory,
  Screenshot
} from "../components/types";
import React from "react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "features", label: "Features", icon: CheckCircle },
  { id: "screenshots", label: "Screenshots", icon: Image },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "pricing", label: "Pricing", icon: TrendingUp },
];

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  "PMS": <Home className="w-5 h-5" />,
  "Channel Manager": <Globe className="w-5 h-5" />,
  "Pricing Engine": <DollarSign className="w-5 h-5" />,
  "Pricing": <DollarSign className="w-5 h-5" />,
  "Analytics": <BarChart className="w-5 h-5" />,
  "Revenue Analytics": <BarChart className="w-5 h-5" />,
  "Operations": <Wrench className="w-5 h-5" />,
  "Maintenance": <Wrench className="w-5 h-5" />,
  "Housekeeping": <Wrench className="w-5 h-5" />,
  "Smart Home": <Home className="w-5 h-5" />,
  "Messaging": <MessageSquare className="w-5 h-5" />,
  "Guest Communication": <MessageSquare className="w-5 h-5" />,
  "Market Intelligence": <Target className="w-5 h-5" />,
  "Distribution": <Globe className="w-5 h-5" />,
  "Direct Booking": <Building className="w-5 h-5" />,
  "Marketing": <Target className="w-5 h-5" />,
  "Procurement": <Briefcase className="w-5 h-5" />,
  "Staffing": <UsersRound className="w-5 h-5" />,
  "Consulting": <UserCog className="w-5 h-5" />,
  "Insurance": <Shield className="w-5 h-5" />,
  "Tax & Compliance": <Receipt className="w-5 h-5" />,
  "Owner Portal": <Users className="w-5 h-5" />,
  "Payments": <Receipt className="w-5 h-5" />,
  "Trust": <Shield className="w-5 h-5" />,
};

const DefaultIcon = <Settings className="w-5 h-5" />;

// FAQ Accordion Item Component
const FAQAccordionItem = ({ faq, index, isOpen, onToggle }: { 
  faq: { question: string; answer: string }; 
  index: number; 
  isOpen: boolean; 
  onToggle: () => void;
}) => {
  return (
    <div className="group">
      <div
        className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
          isOpen
            ? "border-blue-300 shadow-lg ring-1 ring-blue-100"
            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
        }`}
      >
        <button
          onClick={onToggle}
          className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isOpen
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <div className="font-semibold text-sm">{index + 1}</div>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {faq.question}
              </h3>
            </div>
          </div>
          <div
            className={`ml-4 flex-shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-blue-600" : "text-gray-400"
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </div>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 pb-6 pl-16">
            <div className="relative">
              <div className="absolute -left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-100 to-transparent" />
              <div className="bg-gradient-to-r from-blue-50/50 to-transparent rounded-xl p-6">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pricing Card Component
const PricingCard = ({ 
  plan, 
  selectedPlan, 
  onSelect,
  paying,
  selectedPlanToPay 
}: { 
  plan: CommercialPlan;
  selectedPlan: string;
  onSelect: (planKey: string) => void;
  paying: boolean;
  selectedPlanToPay: string;
}) => {
  const isFree = plan.plan_key === "free";
  const isCore = plan.plan_key === "core";
  const isPremium = plan.plan_key === "premium";
  
  const discountLabel = plan.original_price && plan.original_price > plan.price
    ? `${Math.round(((plan.original_price - plan.price) / plan.original_price) * 100)}% off`
    : null;

  return (
    <div
      className={`relative rounded-[18px] overflow-hidden min-h-[720px] flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.08)] cursor-pointer transition-all duration-300 ${
        selectedPlan === plan.plan_key
          ? "ring-2 ring-blue-500 shadow-xl transform scale-[1.02]"
          : "hover:scale-[1.01] hover:shadow-xl"
      } ${
        isPremium
          ? "bg-[#f1f3f6] text-[#111827]"
          : "bg-[linear-gradient(180deg,#5f91c9_0%,#5d92cb_35%,#4a8ec7_70%,#348cbc_100%)] text-white border border-white/20"
      }`}
      onClick={() => onSelect(plan.plan_key)}
    >
      {isPremium && plan.launch_label && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#ff6a00] to-[#ff2d55] text-white text-[13px] font-bold text-center py-2 uppercase tracking-wide">
          {plan.launch_label}
        </div>
      )}

      <div className={`p-8 flex flex-col h-full ${isPremium ? "pt-14" : ""}`}>
        <div>
          <h3 className={`text-[22px] font-bold ${isPremium ? "text-[#111827]" : "text-white"}`}>
            {plan.name}
          </h3>

          <p className={`mt-2 text-[15px] ${isPremium ? "text-gray-500" : "text-white/85"}`}>
            {plan.description}
          </p>

          <div className="mt-10">
            {plan.original_price != null && plan.original_price > plan.price && (
              <div className={`text-[18px] line-through mb-1 ${isPremium ? "text-gray-400" : "text-white/55"}`}>
                €{plan.original_price.toLocaleString()}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className={`text-[48px] leading-none font-extrabold ${isPremium ? "text-[#0f172a]" : "text-white"}`}>
                €{plan.price.toLocaleString()}
              </div>
              <div className={`text-[16px] mb-1 ${isPremium ? "text-gray-600" : "text-white/85"}`}>
                /{plan.billing_period}
              </div>
            </div>

            {discountLabel && (
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full bg-[#8a2be2] text-white text-[12px] font-semibold px-3 py-1">
                  {plan.badge_text || discountLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          {isFree ? (
            <button className="mx-auto block rounded-[10px] bg-[#2f3a4c] hover:bg-[#263140] text-white font-semibold px-10 py-3 shadow-md">
              ⊙ Current Plan
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(plan.plan_key);
              }}
              disabled={paying}
              className={`w-full rounded-[10px] font-semibold py-4 px-6 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                isCore
                  ? "bg-white text-[#1f2937] hover:bg-gray-100"
                  : "bg-gradient-to-r from-[#2c6fb6] to-[#12a8b2] text-white hover:opacity-95"
              }`}
            >
              {paying && selectedPlanToPay === plan.plan_key ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                plan.button_text || `Upgrade to ${plan.name}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProviderDetailsProps {
  providerData: ProviderDashboardData;
}

export default function ProviderDetails({ providerData }: ProviderDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlan, setSelectedPlan] = useState<string>("core");
  const [openFaqs, setOpenFaqs] = useState<number[]>([0]);
  const [commercialFeatures, setCommercialFeatures] = useState<CommercialFeature[]>([]);
  const [commercialPlans, setCommercialPlans] = useState<CommercialPlan[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPlanToPay, setSelectedPlanToPay] = useState<string>("core");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const supabase = createClient();

  // Destructure with safe defaults
  const { provider, products = [], stats, integrations = [], references = [], featureHierarchy = [] } = providerData || {};

  // Get selected feature IDs from products
  const selectedFeatureIds = useMemo(() => {
    const ids = new Set<string>();
    products.forEach(product => {
      product.features?.forEach(feature => {
        ids.add(feature.id);
      });
    });
    return ids;
  }, [products]);

  // Use linked company name if available, otherwise use provider's company_name
  const displayName = provider?.linked_company?.name || provider?.company_name || "Unknown Provider";
  const description = provider?.linked_company?.description || provider?.company_description || provider?.tell_us_about_company || 'No description available';
  const companyType = provider?.linked_company?.primary_type || provider?.company_primary_type || 'Technology';
  const logoUrl = provider?.linked_company?.logo_url || null;
  const foundedYear = provider?.linked_company?.founded_year || null;
  const employeeCount = provider?.linked_company?.employee_count || null;
  const websiteUrl = provider?.linked_company?.website_url || null;

  // Get first two letters of company name for logo
  const shortName = displayName
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Calculate average rating
  const avgRating = products.length > 0
    ? products.reduce((acc: number, product: Product) => acc + (product.rating || 0), 0) / products.length
    : 0;

  // Calculate total reviews
  const totalReviews = products.reduce((acc: number, product: Product) => acc + (product.review_count || 0), 0);

  // Fetch commercial features and plans
  useEffect(() => {
    const fetchCommercialData = async () => {
      try {
        setLoadingFeatures(true);
        const [
          { data: featuresData, error: featuresError },
          { data: plansData, error: plansError },
        ] = await Promise.all([
          supabase
            .from("commercial_features")
            .select("*")
            .order("section", { ascending: true })
            .order("sort_order", { ascending: true }),
          supabase
            .from("commercial_plans")
            .select("*")
            .order("sort_order", { ascending: true }),
        ]);

        if (featuresError) throw featuresError;
        if (plansError) throw plansError;

        const uniqueFeatures = featuresData?.reduce((acc: CommercialFeature[], current) => {
          const exists = acc.find(
            (item) =>
              item.product_feature === current.product_feature &&
              item.section === current.section
          );
          if (!exists) acc.push(current as CommercialFeature);
          return acc;
        }, []) || [];

        setCommercialFeatures(uniqueFeatures);
        setCommercialPlans((plansData || []) as CommercialPlan[]);
      } catch (err) {
        console.error("Error fetching commercial data:", err);
      } finally {
        setLoadingFeatures(false);
      }
    };

    fetchCommercialData();
  }, [supabase]);

  // Group features by section for pricing table
  const groupedFeatures = useMemo(() => {
    const grouped = commercialFeatures.reduce<Record<string, CommercialFeature[]>>((acc, item) => {
      const key = (item.section || "Other").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.sort_order - b.sort_order);
    });

    return grouped;
  }, [commercialFeatures]);

  const orderedSections = useMemo(() => {
    const sectionOrder = ["Product Feature", "Service Offering", "Other"];
    return Object.keys(groupedFeatures).sort((a, b) => {
      const ai = sectionOrder.indexOf(a);
      const bi = sectionOrder.indexOf(b);
      const aRank = ai === -1 ? 999 : ai;
      const bRank = bi === -1 ? 999 : bi;
      return aRank - bRank;
    });
  }, [groupedFeatures]);

  const orderedPlans = useMemo(() => {
    const preferredOrder = ["free", "core", "premium"];
    return [...commercialPlans].sort(
      (a, b) =>
        preferredOrder.indexOf(a.plan_key) - preferredOrder.indexOf(b.plan_key)
    );
  }, [commercialPlans]);

  const renderPlanCell = (feature: CommercialFeature, planKey: string) => {
    const labelMap = {
      free: feature.free_label,
      core: feature.core_label,
      premium: feature.premium_label,
    };

    const enabledMap = {
      free: feature.free,
      core: feature.core,
      premium: feature.premium,
    };

    if (labelMap[planKey as keyof typeof labelMap]) {
      return (
        <span className="text-sm font-medium text-blue-600">
          {labelMap[planKey as keyof typeof labelMap]}
        </span>
      );
    }

    return enabledMap[planKey as keyof typeof enabledMap] ? (
      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-gray-300 mx-auto" />
    );
  };

  const handlePay = async (planKey: string) => {
    try {
      setPaying(true);
      setSelectedPlanToPay(planKey);

      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: planKey, providerId: me.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to start payment");

      window.location.href = json.url;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPaying(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const faqs = [
    {
      question: "How is STR Market Map different from other directories?",
      answer:
        "Most importantly: it's not 'pay for play' as we list and compare all products.\n\nSTR Market Map is context-driven. Unlike traditional directories that simply list tools alphabetically, we show how providers fit into real operator setups based on units, market, PMS, and specific needs. Operators don't search for tools—they compare apples with apples and look at their complete setup.",
    },
    {
      question: "Is there really a free plan?",
      answer:
        "Yes. Free Presence gives you basic discoverability. No strings, no dark patterns. You can upgrade anytime.",
    },
    {
      question: "How do you ensure fair visibility?",
      answer:
        "There are no paid rankings. Visibility is based on context, quality, and how current your profile is.",
    },
    {
      question: "Can I upgrade or downgrade anytime?",
      answer:
        "Yes. You can change your visibility level at any time. No lock-in.",
    },
    {
      question: "What happens during the launch phase?",
      answer:
        "Early providers help shape how their category is represented. Launch pricing applies to these co-creators.",
    },
    {
      question: "What kind of leads can I expect?",
      answer:
        "Leads come from operators actively evaluating solutions in their specific context. Each lead includes their unit count, market, current tech stack, and what they're looking for. Premium members will likely see more qualified leads than Free listings because of enhanced visibility in contextual shortlists, case studies, events, and more.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const renderFeatureHierarchy = () => {
    // Filter to only show catalogue categories (not primary_type)
    const catalogueCategories = (featureHierarchy as FeatureCategory[]).filter(
      (cat: FeatureCategory) => cat.kind === 'catalogue'
    );

    if (catalogueCategories.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No features available yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {catalogueCategories.map((category: FeatureCategory) => {
          const hasSelectedFeatures = category.modules.some(module =>
            module.features.some(feature => selectedFeatureIds.has(feature.id))
          );
          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                  hasSelectedFeatures ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {categoryIcons[category.name] || DefaultIcon}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasSelectedFeatures && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Has features
                    </span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 pt-0 border-t border-gray-100">
                  {category.modules.map((module: FeatureModule) => {
                    const moduleFeatures = module.features;
                    const selectedCount = moduleFeatures.filter(f => selectedFeatureIds.has(f.id)).length;

                    if (moduleFeatures.length === 0) return null;

                    return (
                      <div key={module.id} className="mt-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-medium text-gray-800">{module.name}</h4>
                          {selectedCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {selectedCount}/{moduleFeatures.length} selected
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {moduleFeatures.map((feature: Feature) => {
                            const isSelected = selectedFeatureIds.has(feature.id);
                            return (
                              <div
                                key={feature.id}
                                className={`p-3 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {isSelected ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {feature.name}
                                    </div>
                                    {feature.definition && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {feature.definition}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* About Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">About {displayName}</h3>
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {foundedYear && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Founded</div>
                      <div className="text-lg font-semibold text-gray-900">{foundedYear}</div>
                    </div>
                  </div>
                )}
                {provider?.linked_company?.headquarters && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Headquarters</div>
                      <div className="text-lg font-semibold text-gray-900">{provider.linked_company.headquarters}</div>
                    </div>
                  </div>
                )}
                {employeeCount && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Team Size</div>
                      <div className="text-lg font-semibold text-gray-900">{employeeCount}+ employees</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2">Products</div>
                <div className="text-3xl font-bold text-blue-900">{stats?.productsCount || 0}</div>
                <p className="text-sm text-blue-700 mt-1">Active solutions</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="text-sm font-medium text-emerald-900 mb-2">Integrations</div>
                <div className="text-3xl font-bold text-emerald-900">{stats?.integrationsCount || 0}</div>
                <p className="text-sm text-emerald-700 mt-1">{stats?.activeIntegrations || 0} active</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-sm font-medium text-purple-900 mb-2">References</div>
                <div className="text-3xl font-bold text-purple-900">{stats?.referencesCount || 0}</div>
                <p className="text-sm text-purple-700 mt-1">{stats?.confirmedReferences || 0} confirmed</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="text-sm font-medium text-amber-900 mb-2">Rating</div>
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  <span className="text-3xl font-bold text-amber-900">{avgRating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">({totalReviews} reviews)</p>
              </div>
            </div>

            {/* Key Features from Products */}
            <div className="bg-white rounded-xl p-8 border shadow-sm">
              <h4 className="text-xl font-semibold text-gray-900 mb-8">Key Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((product: Product) => (
                  <div
                    key={product.id}
                    className="bg-gradient-to-br from-gray-50 to-white border rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 mb-2">{product.name}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{product.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {products.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No products available yet.</p>
                </div>
              )}
            </div>
          </div>
        );

      case "features":
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Product Features</h3>
            <p className="text-gray-600 mb-8">
              Features selected for this provider's products. Click on categories to expand and view details.
            </p>
            {renderFeatureHierarchy()}
          </div>
        );

      case "screenshots":
        const allScreenshots = products.flatMap((product: Product) => product.screenshots || []);
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Screenshots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allScreenshots.map((screenshot: Screenshot, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden border shadow-sm hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {screenshot.url ? (
                      <img src={screenshot.url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <div className="font-medium text-gray-900">Screenshot {idx + 1}</div>
                  </div>
                </div>
              ))}
            </div>
            {allScreenshots.length === 0 && (
              <div className="text-center py-12">
                <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No screenshots available yet.</p>
              </div>
            )}
          </div>
        );

      case "integrations":
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Integrations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {integrations.map((integration: any) => (
                <div
                  key={integration.id}
                  className="bg-white border rounded-xl p-6 flex flex-col items-center justify-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-white border-2 mb-4 flex items-center justify-center">
                    <Plug className="w-8 h-8 text-gray-600" />
                  </div>
                  <span className="font-bold text-gray-900 text-center mb-2">
                    {integration.integration_type}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      integration.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {integration.status}
                  </span>
                </div>
              ))}
            </div>
            {integrations.length === 0 && (
              <div className="text-center py-12">
                <Plug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No integrations listed yet.</p>
              </div>
            )}
          </div>
        );

      case "reviews":
        return (
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    <span className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                  </div>
                  <div className="text-gray-600">
                    <div className="font-semibold">Based on {totalReviews} reviews</div>
                    <div className="text-sm">{avgRating.toFixed(1)} average rating</div>
                  </div>
                </div>
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg transition-all hover:opacity-90">
                Write a Review
              </button>
            </div>

            <div className="space-y-8">
              {references.map((reference: any) => (
                <div key={reference.id} className="border-b pb-8 last:border-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                        <span className="font-bold text-blue-600">C</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Customer Reference</h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            reference.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {reference.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {reference.content || "No review content available."}
                  </p>
                </div>
              ))}
              {references.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews available yet.</p>
                </div>
              )}
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-12">
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {orderedPlans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  selectedPlan={selectedPlan}
                  onSelect={setSelectedPlan}
                  paying={paying}
                  selectedPlanToPay={selectedPlanToPay}
                />
              ))}
            </div>

            {/* Plan Details Table */}
            {!loadingFeatures && commercialFeatures.length > 0 && (
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-200">
                <div className="text-center mb-12 mt-12">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Plan Details</h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Compare visibility levels in detail
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-6" />
                        {orderedPlans.map((plan) => (
                          <th key={plan.id} className="text-center p-6">
                            <div className="flex flex-col items-center">
                              <div className={`font-bold text-lg mb-1 ${
                                plan.plan_key === "free"
                                  ? "text-gray-700"
                                  : plan.plan_key === "core"
                                  ? "text-blue-700"
                                  : "text-purple-700"
                              }`}>
                                {plan.name}
                              </div>
                              <div className={`h-1 w-12 rounded-full ${
                                plan.plan_key === "free"
                                  ? "bg-gray-600"
                                  : plan.plan_key === "core"
                                  ? "bg-blue-600"
                                  : "bg-gradient-to-r from-purple-600 to-pink-600"
                              }`} />
                              <div className="text-3xl font-bold mt-3">
                                €{plan.price.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                /{plan.billing_period}
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderedSections.map((section) => (
                        <React.Fragment key={section}>
                          <tr className="bg-gray-100">
                            <td colSpan={orderedPlans.length + 1} className="p-4 pl-8 font-bold text-gray-900">
                              {section}
                            </td>
                          </tr>
                          {groupedFeatures[section]?.map((feature) => (
                            <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                              <td className="p-4 pl-8">
                                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {feature.product_feature}
                                </div>
                                {feature.note_for_devs && (
                                  <div className="text-xs text-gray-500 mt-1 italic">
                                    {feature.note_for_devs}
                                  </div>
                                )}
                              </td>
                              {orderedPlans.map((plan) => (
                                <td key={plan.id} className="text-center p-4">
                                  {renderPlanCell(feature, plan.plan_key)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FAQ Section */}
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl p-8">
              <div className="text-center mb-12">
                <div className="inline-flex p-3 bg-blue-100 rounded-xl mb-6">
                  <HelpCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Get answers to common questions about joining our marketplace
                </p>
              </div>

              <div className="space-y-4 max-w-4xl mx-auto">
                {faqs.map((faq, index) => (
                  <FAQAccordionItem
                    key={index}
                    faq={faq}
                    index={index}
                    isOpen={openFaqs.includes(index)}
                    onToggle={() => toggleFaq(index)}
                  />
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white rounded-3xl p-12 text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Need a custom package?
              </h3>
              <p className="text-xl opacity-90 mb-6 max-w-2xl mx-auto">
                For custom reports, Investor Data reports or other requests just contact us.
              </p>
              <button className="group bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-2 justify-center mx-auto">
                <Phone className="w-5 h-5" />
                Contact Sales
                <Clock className="w-5 h-5 opacity-75" />
              </button>
            </div>
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 border">
                {logoUrl ? (
                  <img
                    src={logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${logoUrl}`}
                    alt={displayName}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentNode as HTMLElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"><span class="font-bold text-white text-2xl">${shortName}</span></div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="font-bold text-white text-2xl">{shortName}</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {displayName}
                  </h1>
                  {provider?.claim_status === "claimed" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white text-sm font-semibold rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      Verified Provider
                    </span>
                  )}
                </div>
                
                <p className="text-lg text-gray-600 mb-6 max-w-3xl">
                  {description}
                </p>
                
                {/* Stats Section */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-2">Products</div>
                    <div className="text-3xl font-bold text-blue-900">{stats?.productsCount || 0}</div>
                    <p className="text-sm text-blue-700 mt-1">Active solutions</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="text-sm font-medium text-emerald-900 mb-2">Integrations</div>
                    <div className="text-3xl font-bold text-emerald-900">{stats?.integrationsCount || 0}</div>
                    <p className="text-sm text-emerald-700 mt-1">{stats?.activeIntegrations || 0} active</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="text-sm font-medium text-purple-900 mb-2">References</div>
                    <div className="text-3xl font-bold text-purple-900">{stats?.referencesCount || 0}</div>
                    <p className="text-sm text-purple-700 mt-1">{stats?.confirmedReferences || 0} confirmed</p>
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="flex gap-3 mt-6">
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Mail className="w-4 h-4" />
                    Contact
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  X,
  ArrowRight,
  Phone,
  HelpCircle,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sparkles,
  Gift,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type PlanKey = "free" | "core" | "premium";
interface CardFeature {
  text: string;
  included: boolean;
  bold?: boolean;
}

interface Feature {
  id: string;
  section: string | null;
  sort_order: number;
  product_feature: string;
  free: boolean;
  core: boolean;
  premium: boolean;
  note_for_devs: string | null;
  free_label?: string | null;
  core_label?: string | null;
  premium_label?: string | null;
}

interface CommercialPlan {
  id: string;
  plan_key: PlanKey;
  name: string;
  price: number;
  original_price: number | null;
  billing_period: string;
  badge_text: string | null;
  button_text: string | null;
  description: string | null;
  highlight: boolean;
  popular: boolean;
  launch_label: string | null;
  sort_order: number;
}

interface FAQItemProps {
  faq: {
    question: string;
    answer: string;
  };
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQAccordionItem: React.FC<FAQItemProps> = ({
  faq,
  index,
  isOpen,
  onToggle,
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
              <div
                className={`text-sm text-gray-500 transition-all duration-300 ${
                  isOpen ? "opacity-100" : "opacity-0 h-0"
                }`}
              >
                Click to {isOpen ? "collapse" : "expand"}
              </div>
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

                {index === 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      <strong>Examples:</strong> Property management software,
                      channel managers, dynamic pricing tools, smart lock
                      providers, cleaning services, maintenance companies,
                      interior designers, photography services, and more.
                    </p>
                  </div>
                )}

                {index === 2 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      <strong>Monthly Metrics:</strong> We provide detailed
                      analytics on traffic sources, visitor demographics, and
                      engagement metrics to help you optimize your presence.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatEuro = (value: number | null | undefined) => {
  if (value == null) return "";
  return `€${Number(value).toLocaleString()}`;
};

const getDiscountLabel = (price: number | null | undefined, original: number | null | undefined) => {
  if (!price || !original || original <= price) return null;
  const discount = Math.round(((original - price) / original) * 100);
  return `${discount}% off`;
};

// Hardcoded plan data for the top cards only
const cardPlans: {
  id: string;
  plan_key: PlanKey;
  name: string;
  price: number;
  original_price: number | null;
  billing_period: string;
  badge_text: string | null;
  button_text: string;
  description: string | null;
  launch_label: string | null;
  features: CardFeature[];
}[] = [
  {
    id: "free-card",
    plan_key: "free",
    name: "Free",
    price: 0,
    original_price: null,
    billing_period: "year",
    badge_text: null,
    button_text: "Current Plan",
    description: "Basic presence",
    launch_label: null,
    features: [
      { text: "Claim Profile", included: true },
      {
        text: "Company Name, Category, Website, Features",
        included: true,
      },
      { text: "Logo and Short description", included: true },
      { text: "Show Integrations", included: true },
      { text: "Lead Tab unlocked", included: false },
      { text: "Analytics Dashboard", included: false },
      { text: "Case Study upload", included: false },
      { text: "Product Images", included: false },
      { text: '"Verified Provider" Badge', included: false },
    ],
  },
  {
    id: "core-card",
    plan_key: "core",
    name: "Core",
    price: 959,
    original_price: 1199,
    billing_period: "year",
    badge_text: "20% discount",
    button_text: "Upgrade to Core",
    description: "Enhanced visibility",
    launch_label: null,
    features: [
      { text: "Everything in Free, plus:", included: true, bold: true },
      { text: "Lead Tab unlocked", included: true },
      { text: "Analytics Dashboard", included: true },
      { text: "Case Study upload (2 per year)", included: true },
      { text: "Product Images", included: true },
      { text: '"Verified Provider" Badge', included: true },
      { text: "Review & Lead Mgmt. (reply)", included: false },
      { text: "Advanced Analytics Dashboard", included: false },
      { text: "Boosted visibility", included: false },
      { text: "Yearly demand & market intelligence report", included: false },
    ],
  },
  {
    id: "premium-card",
    plan_key: "premium",
    name: "Premium",
    price: 2519,
    original_price: 3599,
    billing_period: "year",
    badge_text: "30% discount",
    button_text: "Become a Launch Partner",
    description: "Maximum exposure",
    launch_label: "🚀 MOST POPULAR",
    features: [
      { text: "Everything in Core, plus:", included: true, bold: true },
      { text: "Review & Lead Mgmt. (reply)", included: true },
      { text: "Advanced Analytics Dashboard", included: true },
      { text: "Boosted visibility", included: true },
      { text: "Case Study upload (4 per year)", included: true },
      {
        text: "Yearly demand & market intelligence report",
        included: true,
      },
    ],
  },
];
const CommercialPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("core");
  const [openFaqs, setOpenFaqs] = useState<number[]>([0]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setUserRole] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();
  const [selectedPlanToPay, setSelectedPlanToPay] = useState<PlanKey>("core");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role || "Viewer");

          if (data.role === "Viewer") {
            router.replace("/dashboard");
            return;
          }
        } else {
          router.replace("/auth/login");
          return;
        }
      } catch (error) {
        console.error("Error getting user role:", error);
        router.replace("/auth/login");
      }
    };

    getUserRole();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [
          { data: featureData, error: featureError },
          { data: planData, error: planError },
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

        if (featureError) throw featureError;
        if (planError) throw planError;

        const uniqueFeatures =
          featureData?.reduce((acc: Feature[], current) => {
            const exists = acc.find(
              (item) =>
                item.product_feature === current.product_feature &&
                item.section === current.section
            );
            if (!exists) acc.push(current as Feature);
            return acc;
          }, []) || [];

        setFeatures(uniqueFeatures);
        setPlans((planData || []) as CommercialPlan[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const groupedFeatures = useMemo(() => {
    const grouped = features.reduce<Record<string, Feature[]>>((acc, item) => {
      const key = (item.section || "Other").trim();
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => a.sort_order - b.sort_order);
    });

    return grouped;
  }, [features]);

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
    const preferredOrder: PlanKey[] = ["free", "core", "premium"];
    return [...plans].sort(
      (a, b) =>
        preferredOrder.indexOf(a.plan_key) - preferredOrder.indexOf(b.plan_key)
    );
  }, [plans]);

  const renderPlanCell = (item: Feature, plan: PlanKey) => {
    const labelMap = {
      free: item.free_label,
      core: item.core_label,
      premium: item.premium_label,
    };

    const enabledMap = {
      free: item.free,
      core: item.core,
      premium: item.premium,
    };

    if (labelMap[plan]) {
      return (
        <span className="text-sm font-medium text-blue-600">
          {labelMap[plan]}
        </span>
      );
    }

    return enabledMap[plan] ? (
      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-gray-300 mx-auto" />
    );
  };

  const handlePay = async (plan: PlanKey) => {
    try {
      setPaying(true);
      setSelectedPlanToPay(plan);

      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan, providerId: me.id }),
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
      question: "Is this advertising?",
      answer:
        "No. STR MarketMap is a decision platform, not an ad marketplace. Providers are positioned by relevance, not budget.",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading marketplace plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-xl">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 mb-2">
            Error Loading Data
          </h3>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-2 mb-4">
            Please make sure the Supabase tables are set up correctly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div
        className="py-20 relative overflow-hidden rounded-lg"
        style={{
          background:
            "linear-gradient(180deg, #2B6CB0 0%, #3D7CC4 50%, #00A2AE 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            {!!cardPlans.find(p => p.plan_key === "premium")?.launch_label && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {cardPlans.find(p => p.plan_key === "premium")?.launch_label}
                </span>
              </div>
            )}

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose your visibility level
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Control how operators discover and evaluate your solution.
            </p>
          </div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
  {cardPlans.map((plan) => {
    const isFree = plan.plan_key === "free";
    const isCore = plan.plan_key === "core";
    const isPremium = plan.plan_key === "premium";
    const discountLabel = getDiscountLabel(plan.price, plan.original_price);

    return (
      <div
        key={plan.id}
        className={`relative rounded-[18px] overflow-hidden min-h-[720px] flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${
          isPremium
            ? "bg-[#f1f3f6] text-[#111827]"
            : "bg-[linear-gradient(180deg,#5f91c9_0%,#5d92cb_35%,#4a8ec7_70%,#348cbc_100%)] text-white border border-white/20"
        }`}
      >
        {isPremium && plan.launch_label && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#ff6a00] to-[#ff2d55] text-white text-[13px] font-bold text-center py-2 uppercase tracking-wide">
            {plan.launch_label}
          </div>
        )}

        <div className={`p-8 flex flex-col h-full ${isPremium ? "pt-14" : ""}`}>
          <div>
            <h3
              className={`text-[22px] font-bold ${
                isPremium ? "text-[#111827]" : "text-white"
              }`}
            >
              {plan.name}
            </h3>

            <p
              className={`mt-2 text-[15px] ${
                isPremium ? "text-gray-500" : "text-white/85"
              }`}
            >
              {plan.description}
            </p>

            <div className="mt-10">
              {plan.original_price != null && plan.original_price > plan.price && (
                <div
                  className={`text-[18px] line-through mb-1 ${
                    isPremium ? "text-gray-400" : "text-white/55"
                  }`}
                >
                  {formatEuro(plan.original_price)}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div
                  className={`text-[48px] leading-none font-extrabold ${
                    isPremium ? "text-[#0f172a]" : "text-white"
                  }`}
                >
                  {formatEuro(plan.price)}
                </div>
                <div
                  className={`text-[16px] mb-1 ${
                    isPremium ? "text-gray-600" : "text-white/85"
                  }`}
                >
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
                ⊙ {plan.button_text}
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedPlanToPay(plan.plan_key);
                  handlePay(plan.plan_key);
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
                  plan.button_text
                )}
              </button>
            )}
          </div>

          <div className="mt-8 flex-1">
            <ul className="space-y-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        isPremium ? "text-[#22c55e]" : "text-[#22c55e]"
                      }`}
                    />
                  ) : (
                    <X
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        isPremium ? "text-gray-300" : "text-white/35"
                      }`}
                    />
                  )}

                  <span
                    className={`text-[15px] leading-6 ${
                      feature.included
                        ? isPremium
                          ? "text-gray-700"
                          : "text-white/95"
                        : isPremium
                        ? "text-gray-400"
                        : "text-white/40"
                    } ${feature.bold ? "font-bold" : "font-normal"}`}
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  })}
</div>
        </div>
      </div>

      <div className="py-10">
        <div className="max-w-10xl">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-200">
            <div className="text-center mb-12 mt-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Plan Details
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Compare visibility levels in detail
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-6" />
                    {orderedPlans.map((plan) => {
                      const isSelected = selectedPlan === plan.plan_key;
                      const discountLabel = getDiscountLabel(
                        plan.price,
                        plan.original_price
                      );

                      return (
                        <th
                          key={plan.id}
                          className={`text-center p-6 ${
                            isSelected ? "bg-white ring-1 ring-gray-200" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`font-bold text-lg mb-1 ${
                                plan.plan_key === "free"
                                  ? "text-gray-700"
                                  : plan.plan_key === "core"
                                  ? "text-blue-700"
                                  : "text-purple-700"
                              }`}
                            >
                              {plan.name}
                            </div>

                            <div
                              className={`h-1 w-12 rounded-full ${
                                plan.plan_key === "free"
                                  ? "bg-gray-600"
                                  : plan.plan_key === "core"
                                  ? "bg-blue-600"
                                  : "bg-gradient-to-r from-purple-600 to-pink-600"
                              }`}
                            />

                            {plan.plan_key === "free" ? (
                              <div className="text-3xl font-bold mt-3">
                                {formatEuro(plan.price)}
                              </div>
                            ) : (
                              <div className="mt-3">
                                <div className="text-3xl font-bold">
                                  {formatEuro(plan.price)}
                                </div>
                                {plan.original_price != null &&
                                  plan.original_price > plan.price && (
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                      <span className="text-sm line-through text-gray-400">
                                        {formatEuro(plan.original_price)}
                                      </span>
                                      {discountLabel && (
                                        <span
                                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                            plan.plan_key === "core"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-purple-100 text-purple-700"
                                          }`}
                                        >
                                          {discountLabel}
                                        </span>
                                      )}
                                    </div>
                                  )}
                              </div>
                            )}

                            <div className="text-sm text-gray-500 mt-1">
                              {plan.billing_period}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {orderedSections.map((section) => (
                    <React.Fragment key={section}>
                      <tr className="bg-gray-100">
                        <td
                          colSpan={orderedPlans.length + 1}
                          className="p-4 pl-8 font-bold text-gray-900"
                        >
                          {section}
                        </td>
                      </tr>

                      {groupedFeatures[section]?.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="p-4 pl-8">
                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.product_feature}
                            </div>
                            {item.note_for_devs && (
                              <div className="text-xs text-gray-500 mt-1 italic">
                                {item.note_for_devs}
                              </div>
                            )}
                          </td>

                          <td className="text-center p-4">
                            {renderPlanCell(item, "free")}
                          </td>
                          <td className="text-center p-4">
                            {renderPlanCell(item, "core")}
                          </td>
                          <td className="text-center p-4">
                            {renderPlanCell(item, "premium")}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}

                  <tr className="bg-gray-50/50 border-t-2 border-gray-200">
                    <td className="p-6 pl-8">
                      <div className="font-semibold text-gray-900">
                        Get Started
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Choose your plan and start growing
                      </div>
                    </td>

                    <td className="text-center p-6">
                      <span className="text-sm text-gray-500">
                        Free forever
                      </span>
                    </td>

                    <td className="text-center p-6">
                      <button
                        onClick={() => {
                          setSelectedPlanToPay("core");
                          handlePay("core");
                        }}
                        disabled={paying}
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed group"
                      >
                        {paying && selectedPlanToPay === "core" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Upgrade to Core
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </td>

                    <td className="text-center p-6">
                      <button
                        onClick={() => {
                          setSelectedPlanToPay("premium");
                          handlePay("premium");
                        }}
                        disabled={paying}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed group"
                      >
                        {paying && selectedPlanToPay === "premium" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Get Premium
                            <Sparkles className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="space-y-4">
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
      </div>

      <div className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Need a custom package?
            </h3>
            <p className="text-xl opacity-90 mb-6 max-w-2xl mx-auto">
              For custom reports, Investor Data reports or other requests just
              contact us.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-3">
              <button className="group bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
                <Phone className="w-5 h-5" />
                Contact Sales
                <Clock className="w-5 h-5 opacity-75" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercialPage;
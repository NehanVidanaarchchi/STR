"use client";

import React, { useEffect, useState } from 'react';

import {
  Search,
  BarChart3,
  Bell,
  Award,
  Building2,
  Home,
  Users,
  LineChart,
  Target,
  Sparkles,
  Shield,
  Eye
} from 'lucide-react';
import ProviderClaimForm from '@/app/auth/claim-from';
import { canAccessFeature } from '@/lib/access';
import { createClient } from '@/lib/supabase/client';

type PlanType = "free" | "core" | "premium";

type Feature = {
  id: string;
  product_feature: string;
  free: boolean;
  core: boolean;
  premium: boolean;
};
const ListYourProductPage = () => {
  const trustedCompanies = [
    { name: 'Airbnb', icon: <LineChart className="w-8 h-8 text-blue-600" />, color: 'bg-blue-50' },
    { name: 'Guesty', icon: <Home className="w-8 h-8 text-green-600" />, color: 'bg-green-50' },
    { name: 'Rentals United', icon: <Users className="w-8 h-8 text-purple-600" />, color: 'bg-purple-50' },
    { name: 'Wheelhouse', icon: <Target className="w-8 h-8 text-red-600" />, color: 'bg-red-50' },
    { name: 'PriceLabs', icon: <BarChart3 className="w-8 h-8 text-orange-600" />, color: 'bg-orange-50' },
    { name: 'Transparent', icon: <Shield className="w-8 h-8 text-indigo-600" />, color: 'bg-indigo-50' }
  ];
const [claimFeature, setClaimFeature] = useState<Feature | null>(null);
const [providerPlan, setProviderPlan] = useState<{ plan_id: "free"|"core"|"premium"; plan_status: string } | null>(null);
const [blocked, setBlocked] = useState(false);
  const benefits = [
    {
      title: "Enhanced Credibility",
      desc: "Display verified badges, certifications, and appear in curated categories. Build trust with decision-makers through our platform verification system.",
      icon: <Award className="w-10 h-10" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Maximum Visibility",
      desc: "Show up first in filtered search results. Get discovered by property managers actively looking for solutions in your category.",
      icon: <Eye className="w-10 h-10" />,
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      title: "Quality Leads",
      desc: "Track who views your profile, clicks your website, and requests demos. Turn marketplace visitors into qualified sales opportunities.",
      icon: <Users className="w-10 h-10" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Detailed Analytics",
      desc: "See real-time data on profile views, engagement rates, and competitor comparisons. Make data-driven decisions to optimize your presence.",
      icon: <BarChart3 className="w-10 h-10" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      title: "Buyer Intent Signals",
      desc: "Know exactly when prospects compare you with competitors. Reach out at the perfect moment when they're evaluating solutions.",
      icon: <Bell className="w-10 h-10" />,
      color: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      title: "Feature Showcase",
      desc: "Highlight your unique capabilities with rich media, integration badges, and detailed feature comparisons. Stand out from the competition.",
      icon: <Sparkles className="w-10 h-10" />,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    }
  ];

useEffect(() => {
  const load = async () => {
    const supabase = createClient();

    const { data: feature, error: featureError } = await supabase
      .from("commercial_features")
      .select("id, product_feature, free, core, premium")
      .eq("product_feature", "Claim Profile")
      .maybeSingle(); // ✅ important (can return null safely)

    if (featureError) {
      console.error("Failed to load Claim Profile feature:", featureError);
      setBlocked(true); // safest: block if we cannot load config
      return;
    }

    if (!feature) {
      console.warn("Claim Profile feature row not found in commercial_features table");
      setBlocked(true); // safest: block if row missing
      return;
    }

    setClaimFeature(feature as Feature);

    const meRes = await fetch("/api/auth/me");
    if (!meRes.ok) {
      setBlocked(true);
      return;
    }

    const me = await meRes.json();

    const plan_id = (me.plan_id ?? "free") as PlanType;
    const plan_status = String(me.plan_status ?? "inactive");

    setProviderPlan({ plan_id, plan_status });

    const allowed = canAccessFeature(feature, { plan_id, plan_status });
    setBlocked(!allowed);
  };

  load();
}, []);

// if (blocked) {
//   return (
//     <div className="min-h-screen flex items-center justify-center p-6">
//       <div className="max-w-lg w-full bg-white rounded-2xl border p-8 text-center">
//         <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Required</h2>
//         <p className="text-gray-600 mb-6">
//           Claim Profile is not available in your current plan. Please upgrade to continue.
//         </p>
//         <button
//           onClick={() => window.location.href = "dashboard/commercial"} // your pricing page
//           className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold"
//         >
//           View Plans & Upgrade
//         </button>
//       </div>
//     </div>
//   );
// }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Banner Section */}
      {/* <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block px-4 py-2 mb-6 rounded-full border-2 border-blue-600 text-blue-600 font-semibold text-sm">
            Join 300+ Leading STR Companies
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
            Is your company getting found in the crowded STR space?
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Every week, thousands of property managers search for solutions. If you're not listed, those leads go to your competitors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => document.getElementById('claim-form-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white font-semibold text-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Claim Your Profile Now
            </button>
            <button className="px-8 py-4 rounded-lg bg-white text-gray-800 font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200">
              View Marketplace
            </button>
          </div>
        </div>
      </section> */}

      {/* Claim Form Section */}
      <section id="claim-form-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 mb-4 rounded-full border-2 border-white text-white font-semibold text-sm">
            Ready to Stand Out?
          </span>

          <h2 className="text-4xl font-bold mb-6">
            Join 300+ STR companies already featured on the marketplace
          </h2>

          <p className="text-xl opacity-90 mb-12 max-w-3xl mx-auto">
            Claim your profile today and start generating qualified leads tomorrow.
          </p>
          
          <ProviderClaimForm />
        </div>
      </section>

      {/* Statistics Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "2,500+", title: "Vendors Listed", desc: "Competing for attention" },
              { number: "15,000+", title: "Active Users", desc: "Property managers & hosts" },
              { number: "70%", title: "Struggle to Find Tools", desc: "Without a trusted hub" },
              { number: "300+", title: "Featured Companies", desc: "Getting qualified leads" }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] bg-clip-text text-transparent mb-4">
                  {stat.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{stat.title}</h3>
                <p className="text-gray-600">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Value Proposition Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="border-l-4 border-red-500 bg-red-50 rounded-r-xl p-8 md:p-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Are prospects finding you—or your competitors?
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto md:mx-0">
              Every week, decision-makers search this hub for solutions. They're comparing vendors, reading reviews, and requesting demos. If you're not listed with a compelling profile, those leads go somewhere else.
            </p>
          </div>
        </div>
      </section> */}

      {/* Trusted Companies Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Industry Leaders
          </h3>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Join the most innovative companies in the STR space
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {trustedCompanies.map((company, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 flex flex-col items-center justify-center hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200"
              >
                <div className={`p-4 rounded-lg ${company.color} mb-4 group-hover:scale-110 transition-transform`}>
                  {company.icon}
                </div>
                <span className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Platform Benefits Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block px-4 py-2 mb-4 rounded-full border-2 border-blue-600 text-blue-600 font-semibold text-sm">
            Platform Benefits
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            How the STR Marketplace accelerates your growth
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-16">
            Turn marketplace visibility into qualified leads, competitive intelligence, and revenue growth.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 border-t-4 border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group text-center"
                style={{
                  borderImage: `linear-gradient(to right, ${benefit.color.replace('bg-gradient-to-br from-', '').replace('to-', '').split(' ')[0]}, ${benefit.color.replace('bg-gradient-to-br from-', '').replace('to-', '').split(' ')[1]}) 1`
                }}
              >
                <div className={`w-16 h-16 rounded-full ${benefit.color} mb-6 flex items-center justify-center mx-auto`}>
                  <div className="text-white">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Success Stories Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block px-4 py-2 mb-4 rounded-full border-2 border-white text-white font-semibold text-sm">
            Success Stories
          </span>

          <h2 className="text-4xl font-bold mb-6">
            What our partners are saying
          </h2>

          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-16">
            Real results from companies that invested in their marketplace presence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "CEO, STR Solutions",
                quote: "Listing on this marketplace transformed our lead generation. We saw a 300% increase in qualified leads within the first quarter.",
                rating: 5
              },
              {
                name: "Michael Chen",
                role: "Head of Growth, PropertyTech",
                quote: "The analytics alone are worth the investment. We've optimized our messaging based on real buyer behavior data.",
                rating: 5
              },
              {
                name: "Emily Rodriguez",
                role: "Founder, HostHub",
                quote: "Being featured alongside industry leaders instantly boosted our credibility. Our demo requests tripled in 60 days.",
                rating: 5
              }
            ].map((review, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-left">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-xl">{review.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{review.name}</h4>
                    <p className="opacity-80">{review.role}</p>
                  </div>
                </div>
                <p className="text-white/90 mb-6">
                  "{review.quote}"
                </p>
                <div className="flex">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-300 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Pricing Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] bg-clip-text text-transparent">
              stand out
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-16">
            Compare what you get at each tier
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
                <div className="text-4xl font-bold text-gray-900">$99<span className="text-lg text-gray-600">/month</span></div>
                <p className="text-gray-600 mt-2">Perfect for getting started</p>
              </div>

              <div className="space-y-4 text-left">
                {['Company Profile Page', 'Logo & Branding', 'Category Listing', 'Basic Analytics', 'Product Listings'].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors">
                Get Started
              </button>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-xl border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="text-4xl font-bold text-gray-900">$299<span className="text-lg text-gray-600">/month</span></div>
                <p className="text-gray-600 mt-2">Best for growth-focused companies</p>
              </div>

              <div className="space-y-4 text-left">
                {['Company Profile Page', 'Logo & Branding', 'Category Listing', 'Basic Analytics', 'Product Listings', 'Media Gallery', 'Featured Placement', 'Integration Badges', 'Advanced Analytics', 'Lead Notifications', 'Competitor Insights', 'Priority Support'].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-3 rounded-lg bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white font-semibold hover:opacity-90 transition-opacity">
                Get Started Today
              </button>
            </div>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 mb-4 rounded-full border-2 border-blue-600 text-blue-600 font-semibold text-sm">
            Common Questions
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>

          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            Everything you need to know about listing on our marketplace
          </p>

          <div className="space-y-6 text-left">
            {[
              {
                question: "What kind of companies can list on the STR Marketplace?",
                answer: "Any company offering products or services for short-term rental property managers, hosts, or vacation rental professionals."
              },
              {
                question: "Can I upgrade my listing later?",
                answer: "Yes, you can upgrade from Basic to Premium at any time. All your existing data and analytics will be preserved."
              },
              {
                question: "How do you drive traffic to the marketplace?",
                answer: "We use SEO, content marketing, partnerships, email campaigns, and targeted advertising to attract qualified property managers."
              },
              {
                question: "What analytics and insights will I receive?",
                answer: "You'll get profile views, engagement metrics, lead sources, competitor comparisons, and buyer intent signals."
              },
              {
                question: "How long does it take to get listed?",
                answer: "Most companies are live within 24-48 hours after submitting their profile information."
              },
              {
                question: "What's your refund policy?",
                answer: "We offer a 30-day money-back guarantee. If you're not satisfied, we'll provide a full refund."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                  <span className="text-blue-600 text-2xl ml-4">+</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      
    </div>
  );
};

export default ListYourProductPage;
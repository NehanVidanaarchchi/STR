"use client";

import { useState, useEffect } from "react";
import {
  Upload, Tag, Image as ImageIcon, ChevronDown, Plus, X, CheckCircle,
  Home, Globe, DollarSign, BarChart, MessageSquare, Wrench, Shield,
  FileText, Users, Search, Building, Target, UsersRound, Receipt,
  Briefcase, ChevronRight, Building2, UserCog, Calendar, Settings
} from "lucide-react";
import {
  getFeatureCategories,
  getCategoriesWithModules,
  getFeaturesWithRelations
} from "@/lib/supabase/features";
import { CategoryWithModules, FeatureCategory } from "@/lib/types/features";
import Swal from "sweetalert2";
import FieldRequestModal from "../components/FieldRequestModal";
import { useRouter } from "next/navigation";

// Add this line after the imports
const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/product-screenshots';
// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  "PMS": <Home className="w-5 h-5 text-[#2B6CB0]" />,
  "Channel Manager": <Globe className="w-5 h-5 text-[#2B6CB0]" />,
  "Pricing": <DollarSign className="w-5 h-5 text-[#2B6CB0]" />,
  "Analytics": <BarChart className="w-5 h-5 text-[#2B6CB0]" />,
  "Messaging": <MessageSquare className="w-5 h-5 text-[#2B6CB0]" />,
  "Operations": <Wrench className="w-5 h-5 text-[#2B6CB0]" />,
  "Smart Home": <Home className="w-5 h-5 text-[#2B6CB0]" />,
  "Trust": <Shield className="w-5 h-5 text-[#2B6CB0]" />,
  "Insurance": <FileText className="w-5 h-5 text-[#2B6CB0]" />,
  "Distribution": <Users className="w-5 h-5 text-[#2B6CB0]" />,
  "Metasearch": <Search className="w-5 h-5 text-[#2B6CB0]" />,
  "Market Intelligence": <Target className="w-5 h-5 text-[#2B6CB0]" />,
  "Direct Booking": <Building className="w-5 h-5 text-[#2B6CB0]" />,
  "Marketing": <Target className="w-5 h-5 text-[#2B6CB0]" />,
  "Procurement": <Briefcase className="w-5 h-5 text-[#2B6CB0]" />,
  "Staffing": <UsersRound className="w-5 h-5 text-[#2B6CB0]" />,
  "Tax & Compliance": <Receipt className="w-5 h-5 text-[#2B6CB0]" />,
  "Franchise": <Building2 className="w-5 h-5 text-[#2B6CB0]" />,
  "Corporate / Mid-Term": <Briefcase className="w-5 h-5 text-[#2B6CB0]" />,
  "Consulting": <UserCog className="w-5 h-5 text-[#2B6CB0]" />
};

// Fallback icon
const DefaultIcon = <Settings className="w-5 h-5 text-[#2B6CB0]" />;

// Accordion tab icons mapping
const accordionIcons: Record<string, React.ReactNode> = {
  "core-platform": <Settings className="w-5 h-5" />,
  "pricing-analytics": <BarChart className="w-5 h-5" />,
  "guest-comms": <MessageSquare className="w-5 h-5" />,
  "operations": <Wrench className="w-5 h-5" />,
  "smart-home": <Home className="w-5 h-5" />,
  "growth-distribution": <Globe className="w-5 h-5" />,
  "enablement": <UsersRound className="w-5 h-5" />,
  "corporate-midterm": <Briefcase className="w-5 h-5" />
};

// Feature categories matching the image
const featureCategoriesData = [
  {
    category: "CORE PLATFORM",
    tags: [
      "Channel Manager",
      "Property Management System (PMS)",
      "Direct Booking Website & Engine",
      "Dynamic Pricing (RMS)",
      "Revenue Analytics & BI",
      "API & Integrations Platform",
    ],
  },
  {
    category: "OPERATIONS",
    tags: [
      "Housekeeping & Turnover",
      "Maintenance & Work Orders",
      "Operations Automation & Task Management",
      "Payments & Trust Accounting",
      "Tax & Regulatory Compliance",
      "Owner Portal & Reporting",
      "Inventory & Procurement",
    ],
  },
  {
    category: "GUEST EXPERIENCE",
    tags: [
      "Guest Messaging & Automation (Unified Inbox)",
      "Digital Guidebook & Upsells",
      "Guest Check-in / Check-out & Journey",
      "Reputation & Reviews",
      "Smart Locks & Access Control",
      "IoT / Noise & Property Sensors",
      "Guest Screening / Risk & KYC",
    ],
  },
  {
    category: "GROWTH, DEMAND & STRATEGY",
    tags: [
      "Market & Data Intelligence",
      "Portfolio & Asset Management",
      "Owner Management & Supply Growth",
      "Distribution & OTA Connectivity",
      "Corporate / Mid-term / Long Stay",
      "Marketing & Demand Generation",
    ],
  },
  {
    category: "SERVICES & ENABLEMENT",
    tags: [
      "Consulting & Advisory Services",
      "Cleaning Marketplace / Field Services",
      "Insurance & Damage Protection",
      "HR / Staffing / BPO",
      "Procurement / Vendor Networks",
    ],
  },
];


export default function ProductsPage() {
  const [primaryType, setPrimaryType] = useState<string>("Operations");
  const [freeTrial, setFreeTrial] = useState("Available");
  const [expandedTab, setExpandedTab] = useState<string | null>("core-platform");
  const [featureCategories, setFeatureCategories] = useState<FeatureCategory[]>([]);
  const [categoriesWithModules, setCategoriesWithModules] = useState<CategoryWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [pricingInfo, setPricingInfo] = useState("");
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [selectedFeatureTags, setSelectedFeatureTags] = useState<string[]>([]);
  const [showFieldRequestModal, setShowFieldRequestModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);

  const isPremium = planId === "premium" && planStatus === "active";

  const router = useRouter();
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          console.log(data, 'resssdddssdddd');

          setUserRole(data.role || 'Viewer');

          setPlanId(data.plan_id ?? null);
          setPlanStatus(data.plan_status ?? null);
          // Immediate redirect for Viewers
          if (data.role === 'Viewer') {
            router.replace('/dashboard');
            return;
          }
        } else {
          router.replace('/auth/login');
          return;
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        router.replace('/auth/login');
        return;
      } finally {
        setIsLoadingRole(false);
      }
    };

    getUserRole();
  }, [router]);

  useEffect(() => {
    async function loadSavedProduct() {
      const res = await fetch("/api/products/load");
      const data = await res.json();
      if (data.featureTags) {
        setSelectedFeatureTags(data.featureTags);
      }

      if (!data.product) return;

      setProductId(data.product.id);
      setProductName(data.product.name || "");
      setDescription(data.product.description || "");
      setPricingModel(data.product.pricing_model || "");
      setPricingInfo(data.product.pricing_info || "");
      setFreeTrial(data.product.free_trial ? "Available" : "Not Available");

      // Set primary type from loaded data (this will be the company's primary type if new)
      setPrimaryType(data.product.primary_type || "");

      setSelectedFeatures(new Set(data.features));
      if (data.featureTags) {
        setSelectedFeatureTags(data.featureTags.filter((t: string) => allowedTags.has(t)));
      }
    }

    loadSavedProduct();
  }, []);

  const companyNameMatches = productName === companyName && companyName !== "";
  const descriptionMatches = description === companyDescription && companyDescription !== "";

  async function handleSave() {
    const res = await fetch("/api/products/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: productId,
        name: productName,
        description,
        pricing_model: pricingModel,
        free_trial: freeTrial === "Available",
        pricing_info: pricingInfo,
        primary_type: primaryType,
        selectedFeatures: Array.from(selectedFeatures),
        featureTags: selectedFeatureTags // ✅ ADD THIS
      })
    });

    const data = await res.json();
    if (data.productId) {
      setProductId(data.productId);
    }
    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Data saved successfully!",
      timer: 3000,
      showConfirmButton: false
    });
  }

  async function handleDeleteImage(screenshotId: string) {
    try {
      const confirmed = await Swal.fire({
        title: 'Delete Screenshot?',
        text: 'Are you sure you want to delete this screenshot?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      });

      if (!confirmed.isConfirmed) return;

      const res = await fetch(`/api/products/screenshots/${screenshotId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // Remove from local state
      setScreenshots(prev => prev.filter(img => img.id !== screenshotId));

      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Screenshot removed successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete screenshot',
      });
    }
  }
  async function handleImageUpload(file: File) {
    // if (!isPremium) {
    //   Swal.fire({
    //     icon: "info",
    //     title: "Premium feature",
    //     text: "Uploading screenshots is available on the Premium plan only.",
    //   });
    //   return;
    // }
    if (!productId) {
      alert("Please save the product first");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);

      const res = await fetch("/api/products/upload-screenshot", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setScreenshots(prev => [...prev, data]);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "warning",
        title: "Save required",
        text: "Please save the product before uploading images",
      });
    } finally {
      setUploading(false);
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [categories, categoriesWithMods] = await Promise.all([
          getFeatureCategories(),
          getCategoriesWithModules()
        ]);
        setFeatureCategories(categories);
        setCategoriesWithModules(categoriesWithMods);
      } catch (error) {
        console.error("Error fetching feature data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    console.log('Current productId:', productId);

    if (!productId) {
      console.log('No productId, cannot load screenshots');
      return;
    }

    async function loadImages() {
      const res = await fetch(`/api/products/screenshots?productId=${productId}`);
      const data = await res.json();

      console.log('Screenshots API response:', data);
      console.log('API Response Status:', res.status);

      // Check if we got an error
      if (!res.ok) {
        console.error('API Error:', data);
      }

      setScreenshots(data);
    }

    loadImages();
  }, [productId]);

  // Transform categories to primary types
  const primaryTypes = featureCategories.map(category => ({
    id: category.id,
    title: category.name,
    subtext: category.description || "No description available",
    icon: categoryIcons[category.name] || DefaultIcon,
    selected: primaryType === category.name
  }));

  const catalogueIconsBySlug: Record<string, React.ReactNode> = {
    "pms": <Home className="w-5 h-5" />,
    "channel-manager": <Globe className="w-5 h-5" />,

    "pricing-engine": <DollarSign className="w-5 h-5" />,
    "pricing": <DollarSign className="w-5 h-5" />,

    "analytics": <BarChart className="w-5 h-5" />,
    "revenue-analytics": <BarChart className="w-5 h-5" />,

    "messaging": <MessageSquare className="w-5 h-5" />,
    "guest-communication": <MessageSquare className="w-5 h-5" />,

    "operations": <Wrench className="w-5 h-5" />,
    "maintenance": <Wrench className="w-5 h-5" />,
    "housekeeping": <Wrench className="w-5 h-5" />,

    "smart-home": <Home className="w-5 h-5" />,
    "iot-and-sensors": <Shield className="w-5 h-5" />,

    "market-intelligence": <Target className="w-5 h-5" />,
    "portfolio-and-asset-management": <Target className="w-5 h-5" />,

    "growth-and-distribution": <Users className="w-5 h-5" />,
    "distribution": <Users className="w-5 h-5" />,
    "metasearch": <Search className="w-5 h-5" />,

    "direct-booking": <Building className="w-5 h-5" />,
    "marketing": <Target className="w-5 h-5" />,

    "procurement": <Briefcase className="w-5 h-5" />,
    "inventory-and-procurement": <Briefcase className="w-5 h-5" />,

    "staffing": <UsersRound className="w-5 h-5" />,
    "consulting": <UserCog className="w-5 h-5" />,

    "insurance-and-risk": <FileText className="w-5 h-5" />,
    "cleaning-marketplace": <Wrench className="w-5 h-5" />,
    "owner-portal": <Users className="w-5 h-5" />,

    "payments": <Receipt className="w-5 h-5" />,
    "trust-accounting": <Receipt className="w-5 h-5" />,

    "tax-and-regulatory-compliance": <Receipt className="w-5 h-5" />,
    "corporate-and-mid-term": <Briefcase className="w-5 h-5" />,
  };
  const categoryIconByName: Record<string, React.ReactNode> = {
    "CORE PLATFORM": <Settings className="w-5 h-5" />,
    "PRICING & ANALYTICS": <BarChart className="w-5 h-5" />,
    "GUEST COMMS": <MessageSquare className="w-5 h-5" />,
    "OPERATIONS": <Wrench className="w-5 h-5" />,
    "SMART HOME": <Home className="w-5 h-5" />,
    "GROWTH & DISTRIBUTION": <Globe className="w-5 h-5" />,
    "SERVICES & ENABLEMENT": <UsersRound className="w-5 h-5" />,
    "CORPORATE / MID-TERM": <Briefcase className="w-5 h-5" />,
  };
  const slugify = (s: string) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  // Transform database data to accordion tabs
  const accordionTabs = categoriesWithModules.map((category) => {
    const tabId = slugify(category.name);        // ✅ stable id
    const icon = catalogueIconsBySlug[tabId] || <Settings className="w-5 h-5" />;

    const sections = category.modules.map((module) => ({
      title: module.name,
      subtext: `Features related to ${module.name}`,
      items: module.features.map((feature) => ({
        id: feature.id,
        label: feature.name,
        subtext: feature.definition,
        selected: selectedFeatures.has(feature.id),
      })),
    }));

    return {
      id: tabId,
      title: category.name,
      icon,
      sections,
    };
  });
  // Handle feature selection
  const handleFeatureToggle = (featureId: string) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatures(newSelected);
  };

  // Handle all features in a module
  const handleModuleToggle = (moduleId: string, features: any[]) => {
    const featureIds = features.map(f => f.id);
    const allSelected = featureIds.every(id => selectedFeatures.has(id));

    const newSelected = new Set(selectedFeatures);
    if (allSelected) {
      featureIds.forEach(id => newSelected.delete(id));
    } else {
      featureIds.forEach(id => newSelected.add(id));
    }
    setSelectedFeatures(newSelected);
  };

  // Handle feature tag selection
  const handleFeatureTagToggle = (tag: string) => {
    setSelectedFeatureTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else if (prev.length < 5) {
        return [...prev, tag];
      }
      return prev;
    });
  };

  // Get all tags from all categories
  const allowedTags = new Set(featureCategoriesData.flatMap(c => c.tags));

  // Get total selected count
  const totalSelectedTags = selectedFeatureTags.length;

  // Handle field request submit
  const handleFieldRequestSubmit = async (request: {
    fieldName: string;
    fieldDescription: string;
    contactEmail: string;
  }) => {
    try {
      const res = await fetch("/api/field-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) throw new Error();

      Swal.fire({
        icon: "success",
        title: "Request Submitted",
        text: "We've emailed you a confirmation.",
        timer: 3000,
        showConfirmButton: false
      });

      setShowFieldRequestModal(false);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Please try again later."
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B6CB0] mx-auto"></div>
          <p className="mt-4 text-[#64748B]">Loading product features...</p>
        </div>
      </div>
    );
  }

  // Add this function inside your ProductsPage component, before the return statement
  const getCategoryCounts = () => {
    const counts: Record<string, { total: number; selected: number }> = {};

    accordionTabs.forEach(tab => {
      let total = 0;
      let selected = 0;

      tab.sections.forEach(section => {
        section.items.forEach(item => {
          total++;
          if (selectedFeatures.has(item.id)) {
            selected++;
          }
        });
      });

      counts[tab.id] = { total, selected };
    });

    return counts;
  };

  const categoryCounts = getCategoryCounts();
  return (
    <div className="space-y-8">
      {/* Product Details */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h1 className="text-2xl font-semibold text-[#0F172A] mb-6">Product Details</h1>
        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-[#64748B]">Product Name</label>
              {productName && companyNameMatches && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Auto-filled from company
                </span>
              )}
            </div>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A]"
              placeholder="Enter product name"
            />
          </div>

          {/* Description with Auto-fill Indicator */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-[#64748B]">Description</label>
              {/* {description && description.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Auto-filled from company
                </span>
              )} */}
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A] resize-none"
              placeholder="Describe your product in detail"
            />
            {/* {description && description.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Tip: You can modify this description to be more specific to this product
              </p>
            )} */}
          </div>

          {/* Pricing Model and Free Trial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pricing Model */}
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Pricing Model
              </label>
              <div className="relative">
                <select
                  value={pricingModel}
                  onChange={(e) => setPricingModel(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A] appearance-none"
                >
                  <option value="Per Property">Per Property</option>
                  <option value="Per User">Per User</option>
                  <option value="Tiered Pricing">Tiered Pricing</option>
                  <option value="Commission-based">Commission-based</option>
                  <option value="Freemium">Freemium</option>
                  <option value="Custom Quote">Custom Quote</option>
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>

            {/* Free Trial */}
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">Free Trial</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="free-trial"
                    value="Available"
                    checked={freeTrial === "Available"}
                    onChange={(e) => setFreeTrial(e.target.value)}
                    className="text-[#2B6CB0] focus:ring-[#2B6CB0]"
                  />
                  <span className="text-sm text-[#0F172A]">Available</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="free-trial"
                    value="Not Available"
                    checked={freeTrial === "Not Available"}
                    onChange={(e) => setFreeTrial(e.target.value)}
                    className="text-[#2B6CB0] focus:ring-[#2B6CB0]"
                  />
                  <span className="text-sm text-[#0F172A]">Not Available</span>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div>
            <label className="block text-sm font-medium text-[#64748B] mb-2">
              Pricing Details (Optional)
            </label>

            <textarea
              value={pricingInfo}
              onChange={(e) => setPricingInfo(e.target.value)}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent text-[#0F172A]"
              placeholder="Your pricing is not required to be exact, just help the user with some context..."
            />
          </div>
        </div>
      </div>

      {/* Define Your Primary Product Type */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Define Your Primary Product Type</h2>
          <p className="text-sm text-[#64748B]">
            Select the core category that best represents your product. This classification appears prominently
            on the marketplace and helps operators find your solution quickly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {primaryTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setPrimaryType(type.title)}
              className={`p-4 border rounded-lg text-left transition-all ${type.selected
                ? "border-[#22C55E] bg-[#F0FDF4]"
                : "border-[#E2E8F0] hover:border-[#2B6CB0] hover:bg-[#F8FAFC]"
                }`}
            >
              <div className="flex items-start gap-3">
                {type.icon}
                <div className="flex-1">
                  <h3 className="font-medium text-[#0F172A] mb-1">{type.title}</h3>
                  <p className="text-sm text-[#64748B]">{type.subtext}</p>
                </div>
                {type.selected && (
                  <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Important Info */}
          <div className="border-l-4 border-[#2B6CB0] pl-5 py-5 bg-blue-50 rounded">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Important: Only ONE primary type can be selected</h3>
            <p className="text-sm text-[#64748B]">
              Your primary type determines your product's main category in the marketplace. Choose the
              classification that best represents your core value proposition. You can select additional
              capabilities through Feature Tags below.
            </p>
          </div>

          {/* Current Selection */}
          <div className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] rounded-lg p-6 text-white">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="text-sm font-medium opacity-90">Current Primary Type</p>
                <h3 className="text-xl font-bold mt-1">{primaryType}</h3>
              </div>
            </div>
            <p className="text-sm opacity-90 mb-3">
              {primaryTypes.find(t => t.title === primaryType)?.subtext}
            </p>
            <p className="text-sm font-medium">
              This classification is now visible on the marketplace
            </p>
          </div>
        </div>
      </div>

      {/* Feature Tags */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Feature Tags (Multi-select)</h2>
          <p className="text-sm text-[#64748B] mb-2">
            Note: These tags will appear on the front end to help users quickly identify your core focus areas. Please select up to 5 most relevant feature tags.
          </p>
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Tag className="w-4 h-4" />
            <span className="font-medium text-[#0F172A]">{totalSelectedTags} of 5 tags selected</span>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="space-y-8">
          {featureCategoriesData.map((categoryData) => (
            <div key={categoryData.category}>
              <h3 className="font-semibold text-gray-900 mb-3 text-md">{categoryData.category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categoryData.tags.map((tag) => {
                  const isSelected = selectedFeatureTags.includes(tag);
                  const isDisabled = !isSelected && totalSelectedTags >= 5;
                  return (
                    <button
                      key={tag}
                      onClick={() => !isDisabled && handleFeatureTagToggle(tag)}
                      disabled={isDisabled}
                      className={`flex items-center gap-3 py-2 px-4 rounded-full border transition-all ${isSelected
                        ? 'bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white border-transparent'
                        : isDisabled
                          ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      {isSelected ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[12px] font-medium">{tag}</span>
                          <X className="w-3 h-3" />
                        </div>
                      ) : (
                        <span className="text-[12px] font-medium text-gray-700">{tag}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Features Catalogue */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] overflow-hidden">
        <h2 className="text-2xl font-semibold text-[#0F172A] p-6 border-b border-[#E2E8F0]">Product Features Catalogue</h2>

        {accordionTabs.map((tab) => {
          const counts = categoryCounts[tab.id] || { total: 0, selected: 0 };
          const allSelected = counts.selected === counts.total && counts.total > 0;
          const someSelected = counts.selected > 0 && counts.selected < counts.total;

          return (
            <div key={tab.id} className="border-b border-[#E2E8F0] last:border-b-0">
              <button
                onClick={() => setExpandedTab(expandedTab === tab.id ? null : tab.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <h3 className="text-md font-medium text-[#0F172A]">{tab.title}</h3>
                  {/* Feature Count Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 rounded ${allSelected
                        ? 'bg-green-100 text-green-700'
                        : someSelected
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                      {counts.selected}/{counts.total} selected
                    </span>
                    {allSelected && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-[#64748B] transition-transform ${expandedTab === tab.id ? 'rotate-90' : ''}`} />
              </button>

              {expandedTab === tab.id && (
                <div className="px-6 pb-6 space-y-8">
                  {/* Progress Bar for category completion */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${allSelected ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      style={{ width: `${(counts.selected / counts.total) * 100}%` }}
                    ></div>
                  </div>

                  {/* Section headers with their own counts */}
                  {tab.sections.map((section, sectionIndex) => {
                    const sectionTotal = section.items.length;
                    const sectionSelected = section.items.filter(item => selectedFeatures.has(item.id)).length;
                    const sectionAllSelected = sectionSelected === sectionTotal && sectionTotal > 0;
                    const sectionSomeSelected = sectionSelected > 0 && sectionSelected < sectionTotal;

                    return (
                      <div key={sectionIndex} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-medium text-[#0F172A]">{section.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded ${sectionAllSelected
                                  ? 'bg-green-100 text-green-700'
                                  : sectionSomeSelected
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-[#F1F5F9] text-[#64748B]'
                                }`}>
                                {sectionSelected}/{sectionTotal}
                              </span>
                              {sectionAllSelected && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-sm text-[#64748B] mt-1">{section.subtext}</p>
                          </div>
                          <button
                            onClick={() => handleModuleToggle(`${tab.id}-${sectionIndex}`, section.items)}
                            className="text-sm text-[#2B6CB0] hover:text-[#255796] font-medium"
                          >
                            {sectionAllSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {section.items.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-start gap-3 p-4 border border-[#E2E8F0] rounded-lg hover:border-[#2B6CB0] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleFeatureToggle(item.id)}
                                className="mt-1 rounded border-[#E2E8F0] text-[#2B6CB0] focus:ring-[#2B6CB0]"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-[#0F172A] block mb-1">{item.label}</span>
                                <span className="text-xs text-[#64748B]">{item.subtext}</span>
                              </div>
                            </label>
                          ))}
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

      {/* Form Field Requests */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Form Field Requests</h2>
        <p className="text-sm text-[#64748B] mb-6">
          Request new form fields to be added to the marketplace profile. Our team will review and implement approved requests.
        </p>
        <button
          onClick={() => setShowFieldRequestModal(true)}
          className="px-6 py-3 bg-[#2B6CB0] text-white text-sm font-medium rounded-lg hover:bg-[#255796] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:ring-offset-2"
        >
          Request Field
        </button>
      </div>

      {/* Product Screenshots */}
      {/* Product Screenshots */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-semibold text-[#0F172A] mb-4">Product Screenshots</h2>
        <p className="text-sm text-[#64748B] mb-6">
          Upload up to 12 product screenshots to showcase your solution (PNG, JPG, or WebP recommended).
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {/* Upload Area */}
          <label className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-6 text-center hover:border-[#2B6CB0] transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
            <p className="text-sm text-[#64748B]">Add Screenshot</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
            />
          </label>

          {screenshots.map((img) => (
            <div key={img.id} className="relative border border-[#E2E8F0] rounded-lg overflow-hidden group">
              <img
                src={img.url || `${SUPABASE_PUBLIC_URL}/${img.file_path}`}
                className="w-full h-48 object-cover"
                alt="Product screenshot"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  // onClick={() => handleDeleteImage(img.id)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#94A3B8]">
          {screenshots.length} of 12 screenshots uploaded
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 border border-[#E2E8F0] text-[#64748B] font-medium rounded-lg hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:ring-offset-2">
          Cancel
        </button>
        <button onClick={handleSave} className="px-6 py-3 bg-[#2B6CB0] text-white font-medium rounded-lg hover:bg-[#255796] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:ring-offset-2">
          Save Product
        </button>
      </div>

      {/* Field Request Modal */}
      <FieldRequestModal
        isOpen={showFieldRequestModal}
        onClose={() => setShowFieldRequestModal(false)}
        onSubmit={handleFieldRequestSubmit}
      />
    </div>
  );
}
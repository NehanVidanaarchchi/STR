"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Globe,
  ChevronDown,
  X,
  Check,
  Link as LinkIcon,
  Building,
  MapPin,
  Calendar,
  Users,
  Globe as GlobeIcon,
  User,
  Mail,
  Plus,
  Info
} from "lucide-react";
import AddReferenceModal from "../components/AddReferenceModal";
import Swal from "sweetalert2";
import countries from "world-countries";

import { checkPermission } from '@/lib/roles';
import { useRouter } from 'next/navigation';

const COUNTRIES = countries
  .map((c) => ({
    code: c.cca2,        // ISO-2 code (US, LK, IN, etc.)
    name: c.name.common, // Human readable
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [isCountriesOpen, setIsCountriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    headline: "Property Management Made Simple",
    description: "",
    website: "",
    linkedin: "",
    country: "United States",
    city: "",
    foundedYear: "2012",
    employeeCount: "0",
  });
  const [userRole, setUserRole] = useState<string>('');
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const router = useRouter();
  const [uploading, setUploading] = useState<"logo" | "icon" | null>(null);

  const [showAddReferenceModal, setShowAddReferenceModal] = useState(false);
  const [selectedSegmentForModal, setSelectedSegmentForModal] = useState("");
  const [newReference, setNewReference] = useState({
    customerName: "",
    companyName: "",
    email: "",
    website: ""
  });
  const isAllSelected = selectedCountries.length === COUNTRIES.length;
  const isIndeterminate =
    selectedCountries.length > 0 && selectedCountries.length < COUNTRIES.length
  const [segmentStates, setSegmentStates] = useState<
    {
      segment: string;
      checked: boolean;
      references: any[];
    }[]
  >([
    { segment: "1–10 Units", checked: false, references: [] },
    { segment: "11–50 Units", checked: false, references: [] },
    { segment: "51–200 Units", checked: false, references: [] },
    { segment: "200+ Units", checked: false, references: [] },
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCountries([]);
    } else {
      setSelectedCountries(COUNTRIES.map(c => c.code));
    }
  };
  // Add this useEffect to get user role
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          console.log(data, 'resssdddssdddd');

          setUserRole(data.role || 'Viewer');

          // Immediate redirect for Viewers
          // if (data.role === 'Viewer') {
          //   router.replace('/dashboard');
          //   return;
          // }
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

  // Check permissions
  const canEditProfile = checkPermission(userRole, 'canEditCompany');
  const canUploadLogo = checkPermission(userRole, 'canUploadAssets');
  const canManageCountries = checkPermission(userRole, 'canEditCompany');
  const canManageReferences = checkPermission(userRole, 'canManageReferences');

  useEffect(() => {
    //if (!userRole || userRole === 'Viewer') return;

    const fetchCompany = async () => {
      try {
        const res = await fetch('/api/company/profile', {
          credentials: 'include',
        });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error);

        setCompany(json.company);
        setSelectedCountries(json.company.countries || []);

        const enabledSegments = json.company.enabled_segments || [];
        console.log('Enabled segments from API:', enabledSegments); // Debug log

        setSegmentStates(prev =>
          prev.map(seg => ({
            ...seg,
            checked: json.company.enabled_segments?.includes(seg.segment) || false,
          }))
        );

        setFormData(prev => ({
          ...prev,
          headline: json.company.product_summary_short || "", // ✅ Add this line
          description: json.company.product_summary_long || '',
          website: json.company.website_url || '',
          linkedin: json.company.linkedin_url || '',
          city: json.company.city || '',
          country: json.company.country || "United States",
          foundedYear: json.company.founded_year?.toString() || '2012',
          employeeCount: json.company.employee_count?.toString() || '0',
        }));

        await loadReferences(json.company.id, enabledSegments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [userRole]);

  useEffect(() => {
    if (company) {
      console.log('=== COMPANY IMAGE DEBUG ===');
      console.log('1. Raw company data:', {
        logo_url: company.logo_url,
        icon_url: company.icon_url,
        type_logo: typeof company.logo_url,
        type_icon: typeof company.icon_url
      });

      // Try to construct URLs using different methods
      if (company.logo_url) {
        console.log('2. Logo URL attempts:');
        console.log('   - Direct path:', company.logo_url);
        console.log('   - Using getPublicImageUrl:', getPublicImageUrl(company.logo_url));

        // Try manual construction
        if (company.logo_url.startsWith('companies/')) {
          console.log('   - Manual company-logos:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${company.logo_url}`);
          console.log('   - Manual company-icons:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-icons/${company.logo_url}`);
          console.log('   - Manual company-assets:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-assets/${company.logo_url}`);
        }
      }

      if (company.icon_url) {
        console.log('3. Icon URL attempts:');
        console.log('   - Direct path:', company.icon_url);
        console.log('   - Using getPublicIconImageUrl:', getPublicIconImageUrl(company.icon_url));

        // Try manual construction
        if (company.icon_url.startsWith('companies/')) {
          console.log('   - Manual company-logos:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${company.icon_url}`);
          console.log('   - Manual company-icons:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-icons/${company.icon_url}`);
          console.log('   - Manual company-assets:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-assets/${company.icon_url}`);
        }
      }
      console.log('=== END DEBUG ===');
    }
  }, [company]);

  const loadReferences = async (companyId: string, enabledSegments: string[]) => {
    try {
      const res = await fetch("/api/company/references");
      const json = await res.json();

      console.log('Loaded references:', json.references);

      setSegmentStates(prev => {
        // Start with the base segments
        const baseStates = [
          { segment: "1–10 Units", checked: false, references: [] },
          { segment: "11–50 Units", checked: false, references: [] },
          { segment: "51–200 Units", checked: false, references: [] },
          { segment: "200+ Units", checked: false, references: [] },
        ];

        // For each segment, set references and determine checked state
        return baseStates.map(seg => {
          const segmentRefs = json.references
            .filter((r: any) => r.segment === seg.segment)
            .map((ref: any) => ({
              id: ref.id,
              customerName: ref.customer_name,
              companyName: ref.company_name,
              email: ref.email,
              website: ref.website,
              status: ref.status,
              confirmation_token: ref.confirmation_token,
              created_at: ref.created_at,
              confirmed_at: ref.confirmed_at
            }));

          // Check if segment should be checked:
          // 1. It's in enabledSegments from company profile OR
          // 2. It has at least one reference
          const shouldBeChecked = enabledSegments.includes(seg.segment) || segmentRefs.length > 0;

          return {
            ...seg,
            checked: shouldBeChecked,
            references: segmentRefs
          };
        });
      });

    } catch (error) {
      console.error('Error loading references:', error);
    }
  };

  // useEffect(() => {
  //   if (!company) return;

  //   const loadReferences = async () => {
  //     try {
  //       const res = await fetch("/api/company/references");
  //       const json = await res.json();

  //       console.log('Loaded references:', json.references);

  //       // First, update segmentStates with references
  //       setSegmentStates(prev => {
  //         const newStates = prev.map(seg => ({
  //           ...seg,
  //           references: json.references.filter(
  //             (r: any) => r.segment === seg.segment
  //           ).map((ref: any) => ({
  //             id: ref.id,
  //             customerName: ref.customer_name,
  //             companyName: ref.company_name,
  //             email: ref.email,
  //             website: ref.website,
  //             status: ref.status,
  //             confirmation_token: ref.confirmation_token,
  //             created_at: ref.created_at,
  //             confirmed_at: ref.confirmed_at
  //           })),
  //         }));

  //         // After setting references, also update checked state based on:
  //         // 1. enabled_segments from company OR
  //         // 2. having at least one reference
  //         return newStates.map(seg => ({
  //           ...seg,
  //           checked: seg.checked || seg.references.length > 0
  //         }));
  //       });

  //     } catch (error) {
  //       console.error('Error loading references:', error);
  //     }
  //   };

  //   loadReferences();
  // }, [company]);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountriesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev =>
      prev.includes(countryCode)
        ? prev.filter(code => code !== countryCode)
        : [...prev, countryCode]
    );
  };

  const removeCountry = (countryCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCountries(prev => prev.filter(code => code !== countryCode));
  };

  const getCountryName = (code: string) => {
    return COUNTRIES.find(c => c.code === code)?.name || code;
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  //   if (!userRole || userRole === 'Viewer') {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="text-red-600 text-6xl mb-4">403</div>
  //         <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
  //         <p className="text-gray-600 mb-6">You do not have permission to access this page.</p>
  //         <button
  //           onClick={() => router.push('/dashboard')}
  //           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  //         >
  //           Go to Dashboard
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }
  // Add loading state
  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "icon"
  ) => {
    if (!canUploadLogo) {
      Swal.fire({
        icon: "error",
        title: "Permission Denied",
        text: "You do not have permission to upload logos",
      });
      return;
    }
    const file = e.target.files?.[0];
    if (!file || !company) return;

    try {
      setUploading(type);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", company.id);
      formData.append("type", type);

      const res = await fetch("/api/company/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      // 🔥 REFETCH COMPANY
      const profileRes = await fetch("/api/company/profile", {
        credentials: "include",
      });
      const profileJson = await profileRes.json();
      setCompany(profileJson.company);
      window.dispatchEvent(new Event("company-updated"));

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: "Logo upload failed. Please try again.",
      });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleIconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "icon"
  ) => {
    if (!canUploadLogo) {
      Swal.fire({
        icon: "error",
        title: "Permission Denied",
        text: "You do not have permission to upload logos",
      });
      return;
    }
    const file = e.target.files?.[0];
    if (!file || !company) return;

    try {
      setUploading(type);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", company.id);
      formData.append("type", "icon");

      const res = await fetch("/api/company/upload-icon", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      // 🔥 REFETCH COMPANY
      const profileRes = await fetch("/api/company/profile", {
        credentials: "include",
      });
      const profileJson = await profileRes.json();
      setCompany(profileJson.company);
      window.dispatchEvent(new Event("company-updated"));

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: "Logo upload failed. Please try again.",
      });
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const getPublicImageUrl = (path?: string) =>
    path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`
      : "/placeholder-logo.png";
  const getPublicIconImageUrl = (path?: string) =>
    path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-icons/${path}`
      : "/placeholder-logo.png";

  const handleSave = async () => {
    if (!canEditProfile) {
      Swal.fire({
        icon: "error",
        title: "Permission Denied",
        text: "You do not have permission to edit the company profile",
      });
      return;
    }
    const enabledSegments = segmentStates
      .filter(seg => seg.checked)
      .map(seg => seg.segment);

    const res = await fetch("/api/companies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: company.id,
        description: formData.description,
        website: formData.website,
        linkedin: formData.linkedin,
        countries: selectedCountries,
        enabledSegments,
        city: formData.city,
        foundedYear: formData.foundedYear,
        employeeCount: formData.employeeCount,
        country: formData.country,
        product_summary_short: formData.headline
      }),
    });

    if (!res.ok) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: "Failed to save company profile",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Company profile saved successfully",
      timer: 2000,
      showConfirmButton: false,
    });
  };
  const isFieldReadOnly = (fieldType: string) => {
    if (!canEditProfile) return true;

    // You can add more specific logic here if needed
    return false;
  };
  const toggleSegment = (index: number) => {
    setSegmentStates(prev => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], checked: !newStates[index].checked };
      return newStates;
    });
  };

  const openAddReferenceModal = (segment: string) => {
    setSelectedSegmentForModal(segment);
    setShowAddReferenceModal(true);
  };

  const closeAddReferenceModal = () => {
    setShowAddReferenceModal(false);
    setSelectedSegmentForModal("");
    setNewReference({
      customerName: "",
      companyName: "",
      email: "",
      website: ""
    });
  };

  const handleNewReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewReference(prev => ({ ...prev, [name]: value }));
  };

  const removeReference = async (segmentIndex: number, referenceId: string) => {
    const result = await Swal.fire({
      title: "Remove reference?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, remove",
    });

    if (!result.isConfirmed) return;

    try {
      // Make API call to delete the reference
      const res = await fetch(`/api/company/references/${referenceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete reference");
      }

      // Update local state only after successful deletion
      setSegmentStates(prev => {
        const newStates = [...prev];
        newStates[segmentIndex] = {
          ...newStates[segmentIndex],
          references: newStates[segmentIndex].references.filter(ref => ref.id !== referenceId)
        };
        return newStates;
      });

      Swal.fire({
        icon: "success",
        title: "Removed",
        text: "Reference deleted successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error instanceof Error ? error.message : "Failed to delete reference",
      });
    }
  };

  const saveNewReference = async (referenceData: {
    customerName: string;
    companyName: string;
    email: string;
    website: string;
  }) => {
    if (!selectedSegmentForModal) return;

    const res = await fetch("/api/company/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segment: selectedSegmentForModal,
        customerName: referenceData.customerName,
        companyName: referenceData.companyName,
        email: referenceData.email,
        website: referenceData.website,
      }),
    });

    if (!res.ok) {
      Swal.fire({
        icon: "error",
        title: "Reference not saved",
        text: "Failed to save customer reference",
      });
      return;
    }

    const { reference } = await res.json();

    // Map the database snake_case fields to camelCase for the frontend
    const mappedReference = {
      id: reference.id,
      customerName: reference.customer_name, // Map from database field
      companyName: reference.company_name,    // Map from database field
      email: reference.email,
      website: reference.website,
      status: reference.status,
      confirmation_token: reference.confirmation_token,
      created_at: reference.created_at,
      confirmed_at: reference.confirmed_at
    };

    setSegmentStates(prev =>
      prev.map(seg => {
        if (seg.segment === selectedSegmentForModal) {
          // Automatically check the segment when adding a reference
          return {
            ...seg,
            checked: true,
            references: [...seg.references, mappedReference]
          };
        }
        return seg;
      })
    );

    setShowAddReferenceModal(false);
    setSelectedSegmentForModal("");

    Swal.fire({
      icon: "success",
      title: "Reference added",
      text: "Customer reference added successfully",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const getConfirmedCount = (references: any[]) => {
    return references.filter(ref => ref.status === "confirmed").length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading company profile...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">Company not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Company Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#0F172A] mb-6">Company Information</h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                value={company.name || ""}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Headline
              </label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                disabled={!canEditProfile}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition ${canEditProfile
                  ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                  }`}
                placeholder="Brief tagline about your company"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={!canEditProfile}
              rows={4}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl transition resize-none ${canEditProfile
                ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                }`}
              placeholder="Detailed description of your company and what you do"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <GlobeIcon className="w-4 h-4" />
                  Website URL
                </div>
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                disabled={!canEditProfile}

                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="https://yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  LinkedIn URL
                </div>
              </label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Country
                </div>
              </label>
              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  disabled={!canEditProfile}

                  onChange={handleSelectChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                disabled={!canEditProfile}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="City where your company is based"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Founded Year
                </div>
              </label>
              <select
                name="foundedYear"
                value={formData.foundedYear} // must be string
                onChange={handleSelectChange}
                disabled={!canEditProfile}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {Array.from({ length: 2026 - 1900 + 1 }, (_, i) => 1900 + i).map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>


            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Employee Count
                </div>
              </label>
              <input
                type="text"
                name="employeeCount"
                value={formData.employeeCount}
                onChange={handleInputChange}
                disabled={!canEditProfile}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., 50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Brand Assets */}
      {canUploadLogo && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Brand Assets</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Logo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Icon</h3>
              <p className="text-sm text-gray-600">Upload your company Icon/favicon for display across the platform. It will be used for the market map and LOW RESOLUTION content. Please use a min 128x128 pixel image in PNG format</p>

              <input
                id="company-logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e, "logo")}
                disabled={!canEditProfile}
              />
              {company.logo_url && (
                <img
                  src={getPublicImageUrl(company.logo_url)}
                  className="h-16 object-contain mb-4"
                  alt="Company Logo"
                />
              )}
              <div className="relative w-full"></div>
              <label
                htmlFor="company-logo-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition hover:bg-blue-50 hover:border-blue-500"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {uploading === "logo" ? "Uploading..." : "Click to upload icon"}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 1MB</p>
              </label>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
              <p className="text-sm text-gray-600">Upload your company logo for display across the platform” to “Upload your company logo for display across the platform. It will be used for the your profile page. Please use a min 128x128 pixel image in PNG format</p>

              <input
                id="company-icon-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleIconUpload(e, "icon")}
                disabled={!canEditProfile}
              />
              {company.icon_url && (
                <img
                  src={getPublicIconImageUrl(company.icon_url)}
                  className="h-16 object-contain mb-4"
                  alt="Company Icon"
                />
              )}
              <div className="relative w-full"></div>
              <label
                htmlFor="company-icon-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition hover:bg-blue-50 hover:border-blue-500"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {uploading === "icon" ? "Uploading..." : "Click to upload logo"}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 1MB</p>
              </label>
            </div>
            {/* Icon Upload */}
            {/* <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Favicon / Icon</h3>
            <p className="text-sm text-gray-600">Upload a square icon for browser tabs and mobile apps</p>

            <input
              id="company-icon-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e, "icon")}
            />
            {company.icon_url && (
              <img
                src={getPublicImageUrl(company.icon_url)}
                className="h-16 object-contain mb-4"
                alt="Company Logo"
              />
            )}

            <div className="relative w-full"></div>
            <label
              htmlFor="company-icon-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition hover:bg-blue-50 hover:border-blue-500"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {uploading === "icon" ? "Uploading..." : "Click to upload icon"}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
            </label>
          </div> */}
          </div>
        </div>
      )}
      {/* Countries of Operation */}
      {canManageCountries && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Countries of Operation</h2>
              <p className="text-sm text-gray-600 mt-1">Select all countries where your products are available</p>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-900">
              Select All Countries
            </span>
          </div>
          <div className="relative" ref={dropdownRef}>
            {/* Selected Countries Display */}
            <div
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white min-h-[56px] flex flex-wrap gap-2 items-center"
              onClick={() => setIsCountriesOpen(!isCountriesOpen)}
            >
              {selectedCountries.length > 0 ? (
                selectedCountries.map(countryCode => {
                  const country = COUNTRIES.find(c => c.code === countryCode);
                  return (
                    <span
                      key={countryCode}
                      className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      <span>{country?.name}</span>
                      <button
                        type="button"
                        onClick={(e) => removeCountry(countryCode, e)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-400">Select countries...</span>
              )}
              <ChevronDown className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${isCountriesOpen ? 'rotate-180' : ''}`} />
            </div>
            {/* Dropdown Options */}
            {isCountriesOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-xl max-h-80 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Countries List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(country => (
                      <div
                        key={country.code}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => toggleCountry(country.code)}
                      >
                        <div className={`flex items-center justify-center w-5 h-5 border rounded mr-3 ${selectedCountries.includes(country.code) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {selectedCountries.includes(country.code) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-gray-900">{country.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No countries found
                    </div>
                  )}
                </div>

                {/* Selection Summary */}
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {selectedCountries.length} of {COUNTRIES.length} selected
                    </span>
                    {selectedCountries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCountries([])}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selection Stats */}
          <div className="flex items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                <span className="font-semibold">{selectedCountries.length}</span> countries selected
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {selectedCountries.length === COUNTRIES.length ? "All countries selected" :
                selectedCountries.length > 0 ? `${selectedCountries.length} active markets` : "No countries selected"}
            </div>
          </div>
        </div>
      )}
      {/* Customer References by Segment */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer References by Segment</h2>

        {/* Info Icon with Tooltip */}
        <div className="relative group">
          <div className="cursor-help">
            <Info className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
          </div>

          {/* Tooltip */}
          <div className="absolute left-0 top-6 z-50 w-96 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="bg-gray-900 text-white text-sm rounded-lg p-4 mt-2 shadow-xl">
              <p className="font-semibold mb-2">Verification Request Email:</p>
              <div className="space-y-2 text-gray-200">
                <p><span className="text-gray-400">Subject:</span> Verification request from [Company Name]</p>
                <p>Dear [FirstName],</p>
                <p>[Company] has listed you as a reference customer on the STR Market Map. Could you please confirm that you are a satisfied customer of [Company] within the [Segment Name] category?</p>
                <p>Please reply to this email with 'Yes' or click the [Confirm] button below.</p>
                <p>It would also mean a lot to [Company] if you could leave a quick review.</p>
                <p className="text-yellow-400">☆☆☆☆☆ (later than linked out to the review page when available)</p>
                <p className="pt-2">Best regards,<br />The STR Market Map Team</p>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mb-8">
          Check the box for each segment you’d like to appear in (even with a ‘Pending Confirmation’ tag). To build trust, you can provide customer references; once two are confirmed for a segment, it will be marked as "verified" on your public profile.
        </p>

        <div className="space-y-6">
          {segmentStates.map((segmentState, index) => (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Segment Header */}
              <div className="bg-gray-50 p-5 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id={`segment-${index}`}
                    checked={segmentState.checked}
                    onChange={() => toggleSegment(index)}
                    disabled={!canEditProfile}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`segment-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-semibold text-gray-900">
                      {/* Yes, we are an ideal product for operators with this portfolio size ({segmentState.segment}) */}
                      Yes, our product is a great fit for operators managing 200+ units ({segmentState.segment})
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <span className="font-medium">
                        {getConfirmedCount(segmentState.references)} confirmed
                      </span>
                      {getConfirmedCount(segmentState.references) >= 2 && (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Verified
                        </span>
                      )}
                    </div>
                  </label>
                  <div className={`text-sm font-medium px-3 py-1 rounded-lg ${getConfirmedCount(segmentState.references) >= 2
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {getConfirmedCount(segmentState.references) >= 2 ? "Verified" : "Pending Confirmation"}
                  </div>
                </div>
              </div>


              {/* Reference List */}
              {segmentState.checked && (
                <div className="p-5">
                  {segmentState.references.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {segmentState.references.map((ref, refIndex) => (
                          <div key={ref.id} className={`border rounded-lg p-4 ${ref.status === "confirmed"
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                            }`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${ref.status === "confirmed" ? "bg-green-500" : "bg-yellow-500"
                                  }`}></div>
                                <span className={`text-sm font-medium ${ref.status === "confirmed" ? "text-green-800" : "text-yellow-800"
                                  }`}>
                                  {ref.status === "confirmed" ? "Confirmed" : "Pending"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeReference(index, ref.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Customer Name</h4>
                                <p className="text-gray-900">{ref.customerName || 'N/A'}</p>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Company Name</h4>
                                <p className="text-gray-900">{ref.companyName || 'N/A'}</p>
                                {ref.status !== "confirmed" && (
                                  <p className="text-sm text-gray-500 mt-1">Pending Confirmation</p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Customer Email</h4>
                                  <p className="text-sm text-gray-600 truncate">{ref.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Website URL</h4>
                                  <p className="text-sm text-blue-600 truncate">{ref.website || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add Reference Button */}
                        {segmentState.references.length < 5 && (
                          <div
                            className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group"
                            onClick={() => openAddReferenceModal(segmentState.segment)}
                          >
                            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                              <Plus className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Add Reference</h4>
                            <p className="text-sm text-gray-500">Add another customer reference</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 mb-3">
                        <Building className="w-12 h-12 mx-auto opacity-50" />
                      </div>
                      <p className="text-gray-500 mb-4">No references added yet</p>
                      <button
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mx-auto"
                        onClick={() => openAddReferenceModal(segmentState.segment)}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add References</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6">
        <button
          type="button"
          className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
        >
          Save Changes
        </button>
      </div>

      <AddReferenceModal
        isOpen={showAddReferenceModal}
        onClose={() => {
          setShowAddReferenceModal(false);
          setSelectedSegmentForModal("");
        }}
        onSave={saveNewReference}
        segment={selectedSegmentForModal}
      />

    </div>
  );
}
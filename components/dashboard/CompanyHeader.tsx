"use client";
import {
    CheckCircle,
    Eye,
    MousePointerClick,
    Users,
    Star,
    Plug,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PublicProfileModal from "./PublicProfileModal";
import { checkPermission } from "@/lib/roles";

export default function CompanyHeader() {
    const [company, setCompany] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [providerId, setProviderId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string>('');
    const [planId, setPlanId] = useState<string | null>(null);
    const [planStatus, setPlanStatus] = useState<string | null>(null);
    const canEditProfile = checkPermission(userRole, 'canEditCompany');
    const canUploadLogo = checkPermission(userRole, 'canUploadAssets');
    const canManageCountries = checkPermission(userRole, 'canEditCompany');
    const canManageReferences = checkPermission(userRole, 'canManageReferences');
    useEffect(() => {
        const fetchMe = async () => {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                setProviderId(data.id)
            }
        }
        fetchMe()
    }, [])

    useEffect(() => {
        const loadCompany = async () => {
            setIsLoading(true);
            setImageError(false);

            const res = await fetch("/api/company/profile", {
                credentials: "include",
                cache: "no-store", // IMPORTANT
            });

            const json = await res.json();
            console.log('Company data:', json.company);
            setCompany(json.company);
            setIsLoading(false);
        };

        loadCompany();

        const handleCompanyUpdated = () => {
            loadCompany();
        };

        window.addEventListener("company-updated", handleCompanyUpdated);

        return () => {
            window.removeEventListener("company-updated", handleCompanyUpdated);
        };
    }, []);


    const getPublicImageUrl = (path?: string) =>
        path
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${path}`
            : "/placeholder-logo.png";

    const handleImageError = () => {
        setImageError(true);
    };

    const handleViewProfile = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsModalOpen(true);
    };

    const isPremiumVerified = planId === "premium" && planStatus === "active";
    const DEFAULT_LOGO = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/companies/default-logo.png`;

    useEffect(() => {
        setImageError(false);
    }, [company?.logo_url]);
    // Determine which image to show
    const displayLogoUrl =
        company?.logo_url && company.logo_url.trim() !== ""
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${company.logo_url}?v=${company?.updated_at || ""}`
            : DEFAULT_LOGO;

    // Optional: Show loading skeleton
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-md animate-pulse">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-200" />
                    <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-64 mb-4" />
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-lg p-3 h-20" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
                        {/* Use regular img tag for better control */}
                        <img
                            src={imageError ? DEFAULT_LOGO : displayLogoUrl}
                            alt="Company logo"
                            className="w-full h-full object-contain"
                            onError={() => setImageError(true)}
                        />

                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl font-semibold text-[#0F172A]">
                                {company?.name || "Your Company"}
                            </h1>
                            {isPremiumVerified && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white text-xs font-medium rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    Verified
                                </span>
                            )}
                        </div>
                        <p className="text-[16px] leading-[24px] text-[#64748B] mb-4">
                            {company?.product_summary_short || ""}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-[#F8FAFC] rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye className="w-4 h-4 text-[#94A3B8]" />
                                    <span className="text-[13px] leading-[18px] text-[#64748B]">Profile Views</span>
                                </div>
                                <p className="text-[28px] leading-[28px] text-[#0F172A] font-medium">0</p>
                            </div>
                            <div className="bg-[#F8FAFC] rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <MousePointerClick className="w-4 h-4 text-[#94A3B8]" />
                                    <span className="text-[13px] leading-[18px] text-[#64748B]">Total Clicks</span>
                                </div>
                                <p className="text-[28px] leading-[28px] text-[#0F172A] font-medium">0</p>
                            </div>
                            <div className="bg-[#F8FAFC] rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-[#94A3B8]" />
                                    <span className="text-[13px] leading-[18px] text-[#64748B]">Leads Generated</span>
                                </div>
                                <p className="text-[28px] leading-[28px] text-[#0F172A] font-medium">0</p>
                            </div>
                            <div className="bg-[#F8FAFC] rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="w-4 h-4 text-[#94A3B8]" />
                                    <span className="text-[13px] leading-[18px] text-[#64748B]">Reviews</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[28px] leading-[28px] text-[#0F172A] font-medium">0</p>
                                    <div className="flex items-center">
                                        {/* {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-3 h-3 ${star <= 4 ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBD5E1]'}`}
                                            />
                                        ))} */}
                                    </div>
                                </div>
                                <p className="text-[13px] leading-[18px] text-[#64748B] mt-1">0</p>
                            </div>
                            <div className="bg-[#F8FAFC] rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Plug className="w-4 h-4 text-[#94A3B8]" />
                                    <span className="text-[13px] leading-[18px] text-[#64748B]">Active Integrations</span>
                                </div>
                                <p className="text-[28px] leading-[28px] text-[#0F172A] font-medium">0</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0FDF4] text-[#22C55E] text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Published
                    </span>
                    {/* <button
                        //disabled={!canEditProfile}
                        onClick={handleViewProfile}
                        className="inline-flex items-center gap-1 text-[14px] leading-[20px] font-medium text-[#2B6CB0] hover:text-[#255796] transition-colors hover:underline cursor-pointer"
                    >
                        <Eye className="w-4 h-4" />
                        View Public Profile
                        <ExternalLink className="w-3 h-3" />
                    </button> */}
                </div>
            </div>

            {providerId && (
                <PublicProfileModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    providerId={providerId}
                />
            )}

        </div>
    );
}

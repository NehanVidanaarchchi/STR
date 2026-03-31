"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2, ChevronRight, Tag, Upload, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";

type Provider = {
    id: string;
    full_name: string;
    work_email: string;
    phone_number: string;
    company_name: string;
    claim_status: string;
    tell_us_about_company: string;
    created_at: string;
    is_active: boolean;
    plan_id: string; 
    // Product fields
    product_name?: string;
    product_description?: string;
    pricing_model?: string;
    free_trial?: string;
    pricing_details?: string;
    primary_product_type?: string[];
    product_features?: Record<string, boolean>;
    feature_tags?: string[];
    product_screenshots?: string[];
};

type PrimaryType = {
    id: string;
    label: string;
    description: string;
};

type FeatureCatalogItem = {
    category: string;
    sections: {
        title: string;
        subtext: string;
        items: {
            id: string;
            label: string;
            subtext: string;
        }[];
    }[];
};

// Add this constant
const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/product-screenshots';

export default function EditProviderModal({
    open,
    provider,
    onClose,
    onSaved,
}: {
    open: boolean;
    provider: Provider | null;
    onClose: () => void;
    onSaved: (p: Provider) => void;
}) {
    const [form, setForm] = useState<Provider | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data from API
    const [primaryTypes, setPrimaryTypes] = useState<PrimaryType[]>([]);
    const [featureCatalog, setFeatureCatalog] = useState<FeatureCatalogItem[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [loadingScreenshots, setLoadingScreenshots] = useState(false);

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
    const [productId, setProductId] = useState<string | null>(null);
    const [screenshots, setScreenshots] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // Fetch reference data when modal opens
    useEffect(() => {
        if (open) {
            console.log('Modal opened, fetching reference data');
            fetchReferenceData();
        }
    }, [open]);

    useEffect(() => {
        if (provider && open) {
            console.log('Provider changed, setting basic form data:', provider.id);
            // First set basic provider data
            setForm({
                ...provider,
                product_name: "",
                product_description: "",
                pricing_model: "",
                free_trial: "Not Available",
                pricing_details: "",
                primary_product_type: [],
                product_features: {},
                feature_tags: [],
                product_screenshots: [],
            });

            // Then fetch product data for this provider
            fetchProviderProduct(provider.id);
        }
        setError(null);
    }, [provider, open]);

    // Fetch screenshots when productId is available
    useEffect(() => {
        console.log('productId changed:', productId);
        if (productId) {
            console.log('Fetching screenshots for product:', productId);
            fetchScreenshots(productId);
        }
    }, [productId]);

    const fetchReferenceData = async () => {
        setLoading(true);
        try {
            // Fetch primary types
            const primaryTypesRes = await fetch('/api/admin-primary-types');
            const primaryTypesData = await primaryTypesRes.json();
            if (primaryTypesData.success) {
                setPrimaryTypes(primaryTypesData.data);
            }

            // Fetch feature catalog
            const catalogRes = await fetch('/api/admin-feature-catalog');
            const catalogData = await catalogRes.json();
            if (catalogData.success) {
                setFeatureCatalog(catalogData.data);
            }

            // Fetch feature tags
            const tagsRes = await fetch('/api/admin-feature-tags');
            const tagsData = await tagsRes.json();
            if (tagsData.success) {
                setAvailableTags(tagsData.data);
            }
        } catch (err) {
            console.error('Error fetching reference data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!provider?.id || !productId) {
            Swal.fire({
                icon: "warning",
                title: "Missing product",
                text: "Product must be loaded before uploading screenshots.",
            });
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("productId", productId);

            const res = await fetch(`/api/admin-providers/${provider.id}/screenshots`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to upload screenshot");
            }

            setScreenshots((prev) => [...prev, data]);

            setForm((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    product_screenshots: [
                        ...(prev.product_screenshots || []),
                        data.url || `${SUPABASE_PUBLIC_URL}/${data.file_path}`,
                    ],
                };
            });

            Swal.fire({
                icon: "success",
                title: "Uploaded",
                text: "Screenshot uploaded successfully",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err: any) {
            console.error("Upload error:", err);
            Swal.fire({
                icon: "error",
                title: "Upload failed",
                text: err.message || "Failed to upload screenshot",
            });
        } finally {
            setUploading(false);
        }
    };

    const fetchProviderProduct = async (providerId: string) => {
        setLoadingProduct(true);
        try {
            console.log('Fetching product for provider:', providerId);
            const response = await fetch(`/api/admin-providers/${providerId}/product`);
            const result = await response.json();

            console.log('Product API response:', result);

            if (result.success && result.data) {
                setForm(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        ...result.data
                    };
                });

                // Initialize selected features from product_features
                if (result.data.product_features) {
                    const features = new Set<string>();
                    Object.entries(result.data.product_features).forEach(([key, value]) => {
                        if (value) features.add(key);
                    });
                    setSelectedFeatures(features);
                }

                // Store productId for screenshot loading
                if (result.data.product_id) {
                    console.log('Setting productId:', result.data.product_id);
                    setProductId(result.data.product_id);
                } else {
                    console.log('No product_id in response');
                }

                console.log('Loaded product data:', result.data);
            }
        } catch (err) {
            console.error('Error fetching provider product:', err);
        } finally {
            setLoadingProduct(false);
        }
    };

    const handleDeleteImage = async (screenshotId: string) => {
        if (!provider?.id) return;

        const confirmed = await Swal.fire({
            title: "Delete Screenshot?",
            text: "Are you sure you want to delete this screenshot?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
        });

        if (!confirmed.isConfirmed) return;

        try {
            const res = await fetch(
                `/api/admin-providers/${provider.id}/screenshots/${screenshotId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to delete screenshot");
            }

            setScreenshots((prev) => prev.filter((img) => img.id !== screenshotId));

            setForm((prev) => {
                if (!prev) return prev;

                const deleted = screenshots.find((img) => img.id === screenshotId);
                const deletedUrl = deleted
                    ? deleted.url || `${SUPABASE_PUBLIC_URL}/${deleted.file_path}`
                    : null;

                return {
                    ...prev,
                    product_screenshots: (prev.product_screenshots || []).filter(
                        (url) => url !== deletedUrl
                    ),
                };
            });

            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: "Screenshot removed successfully",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err: any) {
            console.error("Delete error:", err);
            Swal.fire({
                icon: "error",
                title: "Delete failed",
                text: err.message || "Failed to delete screenshot",
            });
        }
    };

    const fetchScreenshots = async (productId: string) => {
        if (!provider?.id) return;

        setLoadingScreenshots(true);

        try {
            const response = await fetch(
                `/api/admin-providers/${provider.id}/screenshots?productId=${productId}`
            );

            const data = await response.json();

            console.log("Screenshots API response:", data);

            if (!response.ok) {
                console.error("Screenshots API error:", data);
                setScreenshots([]);
                return;
            }

            if (Array.isArray(data)) {
                setScreenshots(data);

                const screenshotUrls = data.map((img: any) => {
                    return img.url || `${SUPABASE_PUBLIC_URL}/${img.file_path}`;
                });

                setForm((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        product_screenshots: screenshotUrls,
                    };
                });
            } else {
                console.error("Expected array but got:", data);
                setScreenshots([]);
            }
        } catch (err) {
            console.error("Error fetching screenshots:", err);
            setScreenshots([]);
        } finally {
            setLoadingScreenshots(false);
        }
    };
    if (!open || !form) return null;

    const onChange = (key: keyof Provider, value: any) => {
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const togglePrimaryProductType = (typeId: string) => {
        const current = form.primary_product_type || [];
        const updated = current.includes(typeId) ? [] : [typeId];
        onChange("primary_product_type", updated);
    };

    const toggleFeatureTag = (tag: string) => {
        const current = form.feature_tags || [];
        const updated = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        onChange("feature_tags", updated);
    };

    const handleFeatureToggle = (featureId: string) => {
        const newSelected = new Set(selectedFeatures);
        if (newSelected.has(featureId)) {
            newSelected.delete(featureId);
        } else {
            newSelected.add(featureId);
        }
        setSelectedFeatures(newSelected);

        const updatedFeatures = { ...(form.product_features || {}) };
        updatedFeatures[featureId] = newSelected.has(featureId);
        onChange("product_features", updatedFeatures);
    };

    const handleModuleToggle = (sectionTitle: string, items: any[]) => {
        const featureIds = items.map(item => item.id);
        const allSelected = featureIds.every(id => selectedFeatures.has(id));

        const newSelected = new Set(selectedFeatures);
        const updatedFeatures = { ...(form.product_features || {}) };

        if (allSelected) {
            featureIds.forEach(id => {
                newSelected.delete(id);
                updatedFeatures[id] = false;
            });
        } else {
            featureIds.forEach(id => {
                newSelected.add(id);
                updatedFeatures[id] = true;
            });
        }

        setSelectedFeatures(newSelected);
        onChange("product_features", updatedFeatures);
    };

    const handleScreenshotAdd = () => {
        const updated = [...(form.product_screenshots || []), ""];
        onChange("product_screenshots", updated);
    };

    const handleScreenshotChange = (index: number, value: string) => {
        const updated = [...(form.product_screenshots || [])];
        updated[index] = value;
        onChange("product_screenshots", updated);
    };

    const handleScreenshotRemove = (index: number) => {
        const updated = (form.product_screenshots || []).filter((_, i) => i !== index);
        onChange("product_screenshots", updated);
    };

    const totalSelectedTags = (form.feature_tags || []).length;

    const save = async () => {
        if (!form) return;

        const confirm = await Swal.fire({
            title: "Save changes?",
            text: "This will update the provider details.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Save",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#2B6CB0",
        });
        if (!confirm.isConfirmed) return;

        Swal.fire({
            title: "Saving...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin-providers/${form.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to update provider");

            await Swal.fire({
                icon: "success",
                title: "Updated!",
                text: "Provider details updated successfully.",
                confirmButtonColor: "#2B6CB0",
            });
            onSaved(json.data);
            onClose();
        } catch (e: any) {
            Swal.fire({
                icon: "error",
                title: "Update failed",
                text: e.message || "Something went wrong",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2B6CB0]" />
                    <span>Loading reference data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
                <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-xl z-10">
                    <h3 className="text-lg font-semibold text-[#0F172A]">Edit Provider</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F1F5F9]">
                        <X className="w-5 h-5 text-[#64748B]" />
                    </button>
                </div>

                <div className="p-5 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    {loadingProduct && (
                        <div className="flex items-center gap-2 text-[#64748B]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading product details...</span>
                        </div>
                    )}

                    {/* Basic Information Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[#0F172A] border-b pb-2">Basic Information</h4>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">Full name</label>
                            <input
                                value={form.full_name}
                                onChange={(e) => onChange("full_name", e.target.value)}
                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">Work email</label>
                            <input
                                value={form.work_email}
                                onChange={(e) => onChange("work_email", e.target.value)}
                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">Phone</label>
                            <input
                                value={form.phone_number}
                                onChange={(e) => onChange("phone_number", e.target.value)}
                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">Company name</label>
                            <input
                                value={form.company_name}
                                onChange={(e) => onChange("company_name", e.target.value)}
                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">Claim status</label>
                            <select
                                value={form.claim_status}
                                onChange={(e) => onChange("claim_status", e.target.value)}
                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
                            >
                                <option value="pending">pending</option>
                                <option value="approved">approved</option>
                                <option value="verified">verified</option>
                                <option value="rejected">rejected</option>
                                <option value="reviewed">reviewed</option>
                                <option value="pending_verification">pending_verification</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="active"
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => onChange("is_active", e.target.checked)}
                            />
                            <label htmlFor="active" className="text-sm text-[#0F172A]">
                                Active
                            </label>
                        </div>
                    </div>

                    {/* Product Details Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[#0F172A] border-b pb-2">Product Details</h4>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">Product Name</label>
                            <input
                                value={form.product_name || ""}
                                onChange={(e) => onChange("product_name", e.target.value)}
                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
                                placeholder="Enter product name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] mb-1">Product Description</label>
                            <textarea
                                value={form.product_description || ""}
                                onChange={(e) => onChange("product_description", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
                                placeholder="Describe the product..."
                            />
                        </div>
                    </div>

                    {/* Primary Product Type Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[#0F172A] border-b pb-2">Primary Product Type</h4>
                        <p className="text-sm text-[#64748B] mb-2">Select the core category that best represents your product.</p>

                        {primaryTypes.length === 0 ? (
                            <p className="text-sm text-[#64748B]">No primary types found</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {primaryTypes.map((type) => (
                                    <div
                                        key={type.id}
                                        onClick={() => togglePrimaryProductType(type.id)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${(form.primary_product_type || []).includes(type.id)
                                                ? "border-[#2B6CB0] bg-blue-50"
                                                : "border-[#CBD5E1] hover:bg-[#F8FAFC]"
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="radio"
                                                name="primary_type"
                                                checked={(form.primary_product_type || []).includes(type.id)}
                                                onChange={() => { }}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-medium text-[#0F172A]">{type.label}</div>
                                                {type.description && (
                                                    <div className="text-xs text-[#64748B] mt-1">{type.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Features Catalogue */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[#0F172A] border-b pb-2">Product Features Catalogue</h4>

                        {featureCatalog.length === 0 ? (
                            <p className="text-sm text-[#64748B]">No features found</p>
                        ) : (
                            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                                {featureCatalog.map((categoryData) => {
                                    const totalFeatures = categoryData.sections.reduce(
                                        (total, section) => total + section.items.length, 0
                                    );

                                    return (
                                        <div key={categoryData.category} className="border-b border-[#E2E8F0] last:border-b-0">
                                            <button
                                                onClick={() => toggleCategory(categoryData.category)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8FAFC] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ChevronRight
                                                        className={`w-5 h-5 text-[#64748B] transition-transform ${expandedCategories[categoryData.category] ? 'rotate-90' : ''
                                                            }`}
                                                    />
                                                    <h5 className="font-medium text-[#0F172A]">{categoryData.category}</h5>
                                                    <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded">
                                                        {totalFeatures} features
                                                    </span>
                                                </div>
                                            </button>

                                            {expandedCategories[categoryData.category] && (
                                                <div className="px-6 pb-6 space-y-6">
                                                    {categoryData.sections.map((section, sectionIdx) => {
                                                        const allFeaturesSelected = section.items.every(
                                                            item => selectedFeatures.has(item.id)
                                                        );

                                                        return (
                                                            <div key={sectionIdx} className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <h6 className="text-sm font-medium text-[#0F172A]">
                                                                            {section.title}
                                                                        </h6>
                                                                        {section.subtext && (
                                                                            <p className="text-xs text-[#64748B] mt-0.5">
                                                                                {section.subtext}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleModuleToggle(section.title, section.items)}
                                                                        className="text-xs text-[#2B6CB0] hover:text-[#255796] font-medium"
                                                                    >
                                                                        {allFeaturesSelected ? 'Deselect All' : 'Select All'}
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {section.items.map((item) => (
                                                                        <label
                                                                            key={item.id}
                                                                            className="flex items-start gap-3 p-3 border border-[#E2E8F0] rounded-lg hover:border-[#2B6CB0] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedFeatures.has(item.id)}
                                                                                onChange={() => handleFeatureToggle(item.id)}
                                                                                className="mt-1 rounded border-[#E2E8F0] text-[#2B6CB0] focus:ring-[#2B6CB0]"
                                                                            />
                                                                            <div className="flex-1">
                                                                                <span className="text-sm font-medium text-[#0F172A] block mb-0.5">
                                                                                    {item.label}
                                                                                </span>
                                                                                {item.subtext && (
                                                                                    <span className="text-xs text-[#64748B]">
                                                                                        {item.subtext}
                                                                                    </span>
                                                                                )}
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
                        )}
                    </div>

                    {/* Feature Tags Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[#0F172A] border-b pb-2">Feature Tags (Multi-select)</h4>

                        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-3">
                            <Tag className="w-4 h-4" />
                            <span className="font-medium text-[#0F172A]">{totalSelectedTags} of 5 tags selected</span>
                        </div>

                        {availableTags.length === 0 ? (
                            <p className="text-sm text-[#64748B]">No feature tags found</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag) => {
                                    const isSelected = (form.feature_tags || []).includes(tag);
                                    const isDisabled = !isSelected && totalSelectedTags >= 5;

                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => !isDisabled && toggleFeatureTag(tag)}
                                            disabled={isDisabled}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${isSelected
                                                    ? 'bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] text-white'
                                                    : isDisabled
                                                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50 text-gray-500'
                                                        : 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Product Screenshots Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[#0F172A] border-b pb-2">Product Screenshots</h4>

                        <p className="text-sm text-[#64748B] mb-3">
                            Upload up to 12 product screenshots to showcase your solution (PNG, JPG, or WebP recommended).
                        </p>

                        {loadingScreenshots && (
                            <div className="flex items-center gap-2 text-[#64748B] mb-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading screenshots...</span>
                            </div>
                        )}

                        {/* Display existing screenshots - same as Products page */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            {/* Upload Area - same as Products page */}
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

                            {/* Display screenshots - same as Products page */}
                            {/* Display screenshots - same as Products page */}
                            {screenshots.length > 0 ? (
                                screenshots.map((img) => (
                                    <div key={img.id} className="relative border border-[#E2E8F0] rounded-lg overflow-hidden group">
                                        <img
                                            src={img.url || `${SUPABASE_PUBLIC_URL}/${img.file_path}`}
                                            className="w-full h-48 object-cover"
                                            alt="Product screenshot"
                                            onError={(e) => {
                                                console.log('Image failed to load:', img.url || `${SUPABASE_PUBLIC_URL}/${img.file_path}`);
                                                e.currentTarget.src = '/placeholder.png';
                                            }}
                                            onLoad={() => console.log('Image loaded successfully:', img.id)}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => handleDeleteImage(img.id)}
                                                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                                            >
                                                <X className="w-4 h-4 text-gray-700" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !loadingScreenshots && <p className="text-sm text-[#64748B] col-span-full text-center py-8">No screenshots uploaded yet</p>
                            )}
                        </div>

                        <p className="text-xs text-[#94A3B8]">
                            {screenshots.length} of 12 screenshots uploaded
                        </p>
                    </div>
                </div>

                <div className="p-5 border-t border-[#E2E8F0] flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-xl z-10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-[#CBD5E1] rounded-lg"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        className="px-4 py-2 bg-[#2B6CB0] text-white rounded-lg hover:bg-[#2c5282] flex items-center"
                        disabled={saving || loadingProduct}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Star, ChevronRight, X, Loader2, Home, MapPin, Grid, Layers, ExternalLink, PlusSquare, BarChart2 } from 'lucide-react';
import { ProviderDashboardData } from '../components/types';
import Link from 'next/link';

export default function Marketplace() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // New UI filters states
    const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
    const [selectedPortfolioSizes, setSelectedPortfolioSizes] = useState<string[]>([]);
    const [selectedRatings, setSelectedRatings] = useState<string[]>([]);

    const [providersData, setProvidersData] = useState<ProviderDashboardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter Options
    const propertyTypeOptions = ['Short-Term Rental', 'Mid-Term Rental', 'Resort & STR', 'Hotel & STR', 'Camping'];
    const portfolioSizeOptions = ['1–10', '11–50', '51–200', '200+'];
    const minimumRatingOptions = ['4.5 & up', '4.0 & up', '3.5 & up'];

    // Fetch providers data
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/providers/dashboard');
                if (!response.ok) throw new Error('Failed to fetch providers');
                const result = await response.json();
                if (result.success) {
                    setProvidersData(result.data);
                } else {
                    throw new Error(result.error || 'Failed to load providers');
                }
            } catch (err) {
                console.error('Error fetching providers:', err);
                setError(err instanceof Error ? err.message : 'Failed to load providers');
            } finally {
                setLoading(false);
            }
        };
        fetchProviders();
    }, []);

    // Extract unique categories from products
    const availableCategories = Array.from(
        new Set(
            providersData.flatMap(provider =>
                provider.products.map(product => product.category)
            )
        )
    ).filter(Boolean) as string[];

    // Filter providers based on search and filters
    const filteredProviders = providersData.filter(providerData => {
        const { provider, products } = providerData;

        const displayName = provider.linked_company?.name || provider.company_name || '';
        const description = provider.linked_company?.description || provider.company_description || provider.tell_us_about_company || '';

        const matchesSearch = searchQuery === '' ||
            displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            products.some(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

        const matchesCategories = selectedCategories.length === 0 ||
            selectedCategories.some(category =>
                products.some(product =>
                    product.category?.toLowerCase().includes(category.toLowerCase())
                )
            );

        // Calculate average rating for filtering
        const avgRating = products.length > 0
            ? products.reduce((acc, product) => acc + (product.rating || 0), 0) / products.length
            : 0;

        const matchesRating = selectedRatings.length === 0 || selectedRatings.some(rStr => {
            const minStr = rStr.split(' ')[0]; // extracts '4.5' from '4.5 & up'
            return avgRating >= parseFloat(minStr);
        });

        // Simple mock matching for property types and portfolio for visual structural completion
        const matchesProperty = selectedPropertyTypes.length === 0 || true;
        const matchesPortfolio = selectedPortfolioSizes.length === 0 || true;

        return matchesSearch && matchesCategories && matchesRating && matchesProperty && matchesPortfolio;
    });

    const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setState(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPropertyTypes([]);
        setSelectedPortfolioSizes([]);
        setSelectedRatings([]);
        setSearchQuery('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading marketplace...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-red-600 mb-4">Error: {error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="lg:w-1/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                        {(selectedCategories.length > 0 || selectedPropertyTypes.length > 0 || selectedPortfolioSizes.length > 0 || selectedRatings.length > 0) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-full transition"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="sticky top-6">


                        {/* Search */}
                        <div className="p-5 mb-8 bg-white rounded-xl shadow-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by name, category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>


                        {/* Property Type Filter */}
                        <div className="mb-6 p-5  bg-white rounded-xl shadow-md">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Home className="w-4 h-4 text-gray-500" />
                                Property Type
                            </h4>
                            <div className="space-y-2.5">
                                {propertyTypeOptions.map((type) => (
                                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedPropertyTypes.includes(type)}
                                            onChange={() => toggleFilter(setSelectedPropertyTypes, type)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                            {type}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Portfolio Size Filter */}
                        <div className="mb-6 p-5  bg-white rounded-xl shadow-md">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Grid className="w-4 h-4 text-gray-500" />
                                Portfolio Size
                            </h4>
                            <div className="space-y-2.5">
                                {portfolioSizeOptions.map((size) => (
                                    <label key={size} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedPortfolioSizes.includes(size)}
                                            onChange={() => toggleFilter(setSelectedPortfolioSizes, size)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                            {size}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Minimum Rating Filter */}
                        <div className="mb-6 p-5  bg-white rounded-xl shadow-md">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-gray-500" />
                                Minimum Rating
                            </h4>
                            <div className="space-y-2.5">
                                {minimumRatingOptions.map((rating) => (
                                    <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedRatings.includes(rating)}
                                            onChange={() => toggleFilter(setSelectedRatings, rating)}
                                            className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                                {rating}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Categories */}
                        {availableCategories.length > 0 && (
                            <div className="mb-4 p-5 bg-white rounded-xl shadow-md">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-gray-500" />
                                    Category
                                </h4>
                                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {availableCategories.map((category) => (
                                        <label key={category} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category)}
                                                onChange={() => toggleFilter(setSelectedCategories, category)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                                {category}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:w-4/5">
                    {/* Results Header */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-6 bg-white rounded-t-xl px-4 sticky top-0 z-10">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                Showing 1–{Math.min(24, filteredProviders.length)} of {filteredProviders.length} companies
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 border border-gray-200">
                            <Filter className="w-4 h-4" />
                            Sort By: Recommended
                        </div>
                    </div>

                    {/* Providers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProviders.slice(0, 24).map((providerData) => (
                            <ProviderCard
                                key={providerData.provider.id}
                                providerData={providerData}
                            />
                        ))}
                    </div>

                    {filteredProviders.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
                            <Search className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No companies found</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Try adjusting your filters or searching for different keywords to find what you need.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProviderCard({ providerData }: { providerData: ProviderDashboardData }) {
    const { provider, products } = providerData;

    const displayName = provider.linked_company?.name || provider.company_name || 'Unknown Provider';
    const description = provider.linked_company?.description || provider.company_description || provider.tell_us_about_company || 'No description available';
    const logoUrl = provider.linked_company?.logo_url || null;
    const country = provider.linked_company?.headquarters || 'USA'; // Placeholder/Fallback
    const primaryCategory = products[0]?.category || 'Software';

    const shortName = displayName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const avgRating = products.length > 0
        ? products.reduce((acc, product) => acc + (product.rating || 0), 0) / products.length
        : 0;

    const totalReviews = products.reduce((acc, product) => acc + (product.review_count || 0), 0);

    return (
        <div className="bg-white rounded-2xl p-6 flex flex-col h-full hover:border-blue-300 hover:shadow-xl shadow-md transition-all duration-300 group">
            {/* Top Section */}
            <div className="flex items-start gap-4 mb-4">
                {/* Logo */}
                {logoUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-50 shrink-0">
                        <img
                            src={logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${logoUrl}`}
                            alt={displayName}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentNode as HTMLElement;
                                if (parent) parent.innerHTML = `<div class="w-full h-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl">${shortName}</div>`;
                            }}
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center shrink-0 border border-blue-200">
                        <span className="font-bold text-blue-700 text-sm">{shortName}</span>
                    </div>
                )}

                {/* Header Information */}
                <div>
                    <h3 className="font-bold text-gray-900 text-md leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">
                        {displayName}
                    </h3>
                    {/* Category Tag */}
                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-md uppercase tracking-wide">
                        {primaryCategory}
                    </span>
                </div>
            </div>

            {/* Rating and Country */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                    {avgRating > 0 ? (
                        <>
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold text-gray-900 text-sm">{avgRating.toFixed(1)}</span>
                            {totalReviews > 0 && (
                                <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                                    ({totalReviews} reviews)
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-gray-400 italic">No reviews yet</span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {country}
                </div>
            </div>

            {/* Description */}
            <div className="flex-1 mb-6">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {description}
                </p>
            </div>

            {/* Interactive Buttons */}
            <div className="flex gap-2 mb-4">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all">
                    <PlusSquare className="w-4 h-4" />
                    Add to My Setup
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all">
                    <BarChart2 className="w-4 h-4" />
                    Compare
                </button>
            </div>

            {/* View Details full-width button */}
            <Link
                href={`/provider?id=${provider.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 
             bg-[linear-gradient(145deg,_rgb(26,54,93),_rgb(42,74,127))] 
             text-white text-xs font-semibold rounded-xl 
             hover:opacity-90 transition-all duration-300"
            >
                View Details
                <ExternalLink className="w-4 h-4" />
            </Link>
        </div>
    );
}
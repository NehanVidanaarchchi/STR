// Add Feature types
export interface Feature {
  id: string;
  name: string;
  definition: string;
  module_id: string | null;
  module?: FeatureModule;
}

export interface FeatureModule {
  id: string;
  name: string;
  category_id: string;
  category?: FeatureCategory;
  features: Feature[];
}

export interface FeatureCategory {
  id: string;
  name: string;
  description: string | null;
  kind: string; // 'primary_type' or 'catalogue'
  modules: FeatureModule[];
}

export interface Screenshot {
  id: string;
  product_id: string;
  file_path: string;
  url: string;
  created_at: string;
}

// Add ProviderDashboardData type
export interface ProviderDashboardData {
  provider: {
    id: string;
    full_name: string;
    company_name: string;
    company_primary_type: string | null;
    company_description: string | null;
    is_active: boolean;
    claim_status: string;
    linked_company: Company | null;
    company_original_name: string | null;
    requested_company_name: string | null;
    requested_company_description: string | null;
    tell_us_about_company: string | null;
  };
  products: Product[];
  integrations: Integration[];
  references: Reference[];
  stats: {
    productsCount: number;
    integrationsCount: number;
    activeIntegrations: number;
    referencesCount: number;
    confirmedReferences: number;
  };
  featureHierarchy: FeatureCategory[]; // Add this line
}

// Add missing types
export interface Integration {
  id: string;
  provider_id?: string;
  company_id?: string;
  integration_type: string;
  status: string;
  created_at: string;
  created_by_company_id: string | null;
}

export interface Reference {
  id: string;
  provider_id?: string;
  company_id?: string;
  status: string;
  content?: string;
  created_at?: string;
}

// Update Product type to include all fields
export interface Product {
  id: string;
  name: string;
  description: string;
  website_url?: string;
  provider_id: string;
  company_id: string;
  category: string;
  pricing_model?: string;
  rating?: number;
  primary_type?: string;
  review_count?: number;
  status: string;
  features: Feature[];
  featureTags: string[];
  modules: FeatureModule[];
  screenshots: Screenshot[];
}

// Update Company type
export interface Company {
  id: string;
  name: string;
  slug?: string;
  description: string;
  website_url?: string;
  logo_url?: string;
  favicon_url?: string;
  icon_url?: string;
  founded_year?: number;
  headquarters?: string;
  employee_count?: number;
  status: string;
  product_summary_short: string;
  product_summary_long?: string;
  primary_type?: string;
  primary_type_sug?: string;
  created_at: string;
  updated_at: string;
}

// Add Commercial types for pricing
export interface CommercialPlan {
  id: string;
  plan_key: 'free' | 'core' | 'premium';
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

export interface CommercialFeature {
  id: string;
  product_feature: string;
  free: boolean;
  core: boolean;
  premium: boolean;
  free_label?: string | null;
  core_label?: string | null;
  premium_label?: string | null;
  section: string | null;
  sort_order: number;
  note_for_devs: string | null;
}

export interface CompanyDashboardData {
  company: Company;
  products?: Product[];
  integrations?: Integration[] | any[];
  references?: Reference[] | any[];
  stats?: any;
}
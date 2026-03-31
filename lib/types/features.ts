export interface FeatureCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface FeatureModule {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface Feature {
  id: string;
  module_id: string;
  name: string;
  definition: string;
  created_at: string;
}

export interface FeatureWithRelations extends Feature {
  module: FeatureModule;
  category: FeatureCategory;
}

export interface ModuleWithFeatures extends FeatureModule {
  features: Feature[];
  category: FeatureCategory;
}

export interface CategoryWithModules extends FeatureCategory {
  modules: ModuleWithFeatures[];
}

// Accordion tab types
export interface AccordionTab {
  id: string;
  title: string;
  icon: React.ReactNode;
  sections: {
    title: string;
    subtext: string;
    items: {
      id: string;
      label: string;
      subtext: string;
      selected: boolean;
    }[];
  }[];
}
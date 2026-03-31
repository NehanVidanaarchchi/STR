import { createClient } from '@/lib/supabase/client';
import {
  CategoryWithModules,
  FeatureCategory,
  FeatureModule,
  Feature
} from '@/lib/types/features';

export async function getFeatureCategories(): Promise<FeatureCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feature_categories')
    .select('*')
    .eq("kind", "primary_type")
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getFeatureModules(categoryId?: string): Promise<FeatureModule[]> {
  const supabase = createClient();
  let query = supabase
    .from('feature_modules')
    .select('*');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  query = query.order('name');

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getFeatures(moduleId?: string): Promise<Feature[]> {
  const supabase = createClient();
  let query = supabase
    .from('features')
    .select('*');

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  query = query.order('name');

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCategoriesWithModules(): Promise<CategoryWithModules[]> {
  const supabase = createClient();
  
  // Get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('feature_categories')
    .select('*')
    .eq("kind", "catalogue")
    .order('name');

  if (categoriesError) throw categoriesError;
  if (!categories) return [];

  // Get all modules with their features
  const { data: modulesWithFeatures, error: modulesError } = await supabase
    .from('feature_modules')
    .select(`
      *,
      features (*)
    `)
    .order('name');

  if (modulesError) throw modulesError;

  // Organize modules by category
  const categoryMap = new Map<string, CategoryWithModules>();
  
  // Initialize categories
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      modules: []
    });
  });

  // Assign modules to categories
  modulesWithFeatures?.forEach(module => {
    const category = categoryMap.get(module.category_id);
    if (category) {
      category.modules.push({
        ...module,
        category
      });
    }
  });

  return Array.from(categoryMap.values());
}

export async function getFeaturesWithRelations(): Promise<Feature[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('features')
    .select(`
      *,
      module:feature_modules (*),
      category:feature_modules!inner(feature_categories (*))
    `)
    .order('name');

  if (error) throw error;
  return data || [];
}
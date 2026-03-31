import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    /* --------------------------------------------------
      1. Fetch all providers with their linked company data
    -------------------------------------------------- */
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select(`
        *,
        linked_company:companies(*)
      `)
      .order('created_at', { ascending: false })

    if (providersError || !providers) {
      return NextResponse.json(
        { error: 'Failed to fetch providers' },
        { status: 500 }
      )
    }

    /* --------------------------------------------------
      2. Fetch products for all providers
    -------------------------------------------------- */
    const providerIds = providers.map(p => p.id)
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('provider_id', providerIds)
      .order('created_at', { ascending: false })

    const productIds = products?.map(p => p.id) || []

    /* --------------------------------------------------
      3. Fetch product features
    -------------------------------------------------- */
    const { data: featureSelections } = await supabase
      .from('product_feature_selections')
      .select('product_id, feature:features(*)')
      .in('product_id', productIds)

    const productFeatures: Record<string, any[]> = {}
    featureSelections?.forEach(item => {
      if (!productFeatures[item.product_id]) productFeatures[item.product_id] = []
      if (item.feature) productFeatures[item.product_id].push(item.feature)
    })

    /* --------------------------------------------------
      4. Fetch product feature tags
    -------------------------------------------------- */
    const { data: tagsData } = await supabase
      .from('product_feature_tags')
      .select('product_id, tag')
      .in('product_id', productIds)

    const productFeatureTags: Record<string, string[]> = {}
    tagsData?.forEach(item => {
      if (!productFeatureTags[item.product_id]) productFeatureTags[item.product_id] = []
      productFeatureTags[item.product_id].push(item.tag)
    })

    /* --------------------------------------------------
      5. Fetch product screenshots
    -------------------------------------------------- */
    const { data: screenshots } = await supabase
      .from('product_screenshots')
      .select('*')
      .in('product_id', productIds)
      .order('created_at', { ascending: true })

    const productScreenshots: Record<string, any[]> = {}
    if (screenshots) {
      for (const shot of screenshots) {
        const { data: signed } = await supabase.storage
          .from('product-screenshots')
          .createSignedUrl(shot.file_path, 60 * 60)

        if (!productScreenshots[shot.product_id]) productScreenshots[shot.product_id] = []
        productScreenshots[shot.product_id].push({ ...shot, url: signed?.signedUrl || null })
      }
    }

    /* --------------------------------------------------
      6. Fetch integrations
    -------------------------------------------------- */
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .in('provider_id', providerIds)

    /* --------------------------------------------------
      7. Fetch references
    -------------------------------------------------- */
    const { data: references } = await supabase
      .from('company_references')
      .select('*')
      .in('provider_id', providerIds)

    /* --------------------------------------------------
      8. Fetch feature modules and categories
    -------------------------------------------------- */
    const productModules: Record<string, any[]> = {}
    if (Object.keys(productFeatures).length > 0) {
      const allModuleIds = Array.from(
        new Set(
          Object.values(productFeatures)
            .flat()
            .map(f => f.module_id)
            .filter(Boolean)
        )
      ) as string[]

      if (allModuleIds.length > 0) {
        const { data: modulesData } = await supabase
          .from('feature_modules')
          .select('id, name, category:feature_categories(name)')
          .in('id', allModuleIds)

        if (modulesData) {
          const modulesMap = new Map(modulesData.map(m => [m.id, m]))
          Object.entries(productFeatures).forEach(([productId, features]) => {
            const uniqueModuleIds = [...new Set(features.map(f => f.module_id).filter(Boolean))]
            productModules[productId] = uniqueModuleIds
              .map(id => modulesMap.get(id))
              .filter(Boolean)
          })
        }
      }
    }

    /* --------------------------------------------------
      9. Assemble per-provider response
    -------------------------------------------------- */
    const response = providers.map(provider => {
      const providerProducts = products?.filter(p => p.provider_id === provider.id) || []
      const providerIntegrations = integrations?.filter(i => i.provider_id === provider.id) || []
      const providerReferences = references?.filter(r => r.provider_id === provider.id) || []

      return {
        provider: {
          id: provider.id,
          full_name: provider.full_name,
          company_name: provider.company_name,
          company_primary_type: provider.company_primary_type,
          company_description: provider.company_description,
          is_active: provider.is_active,
          claim_status: provider.claim_status,
          linked_company: provider.linked_company,
          company_original_name: provider.company_original_name,
          requested_company_name: provider.requested_company_name,
          requested_company_description: provider.requested_company_description,
          tell_us_about_company: provider.tell_us_about_company
        },
        products: providerProducts.map(p => ({
          ...p,
          features: productFeatures[p.id] || [],
          featureTags: productFeatureTags[p.id] || [],
          modules: productModules[p.id] || [],
          screenshots: productScreenshots[p.id] || []
        })),
        integrations: providerIntegrations,
        references: providerReferences,
        stats: {
          productsCount: providerProducts.length,
          integrationsCount: providerIntegrations.length,
          activeIntegrations: providerIntegrations.filter(i => i.status === 'active').length,
          referencesCount: providerReferences.length,
          confirmedReferences: providerReferences.filter(r => r.status === 'confirmed').length
        }
      }
    })

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Providers dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// /app/api/providers/[id]/dashboard/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>
}


async function getAuthedProviderContext() {
  const cookieStore = cookies();
  const providerCookie = (await cookieStore).get("provider_session")?.value;
  const teamCookie = (await cookieStore).get("team_member_session")?.value;

  if (providerCookie) {
    const s = JSON.parse(providerCookie);
    return { providerId: s?.id as string | null, role: "Admin", type: "provider" as const };
  }

  if (teamCookie) {
    const s = JSON.parse(teamCookie);
    return { providerId: s?.provider_id as string | null, role: (s?.role || "Viewer") as string, type: "team_member" as const };
  }

  return { providerId: null, role: "Viewer", type: "team_member" as const };
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
const { providerId } = await getAuthedProviderContext();
    if (!providerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = await createClient()

    console.log('Fetching dashboard data for provider:', providerId)

    // 1. Fetch provider details with ALL fields
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select(`
        *,
        requested_company_name,
        requested_company_description,
        company_primary_type,
        company_original_name,
        company_description
      `)
      .eq('id', providerId)
      .eq('is_active', true)
      .single()

    if (providerError || !provider) {
      console.error('Provider error:', providerError)
      return NextResponse.json(
        { error: 'Provider not found or inactive' },
        { status: 404 }
      )
    }

    // 2. Get company link from company_providers table
    const { data: companyLink, error: linkError } = await supabase
      .from('company_providers')
      .select('company_id')
      .eq('provider_id', providerId)
      .maybeSingle()

    let company = null
    let companyId = null

    // Try junction table first, then fallback to direct link
    if (companyLink?.company_id) {
      companyId = companyLink.company_id
    } else if (provider.linked_company_id) {
      companyId = provider.linked_company_id
      console.warn('Using deprecated linked_company_id field')
    }

    // 3. Fetch company details with ALL fields (if linked)
    if (companyId) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select(`
          *,
          city,
          founded_year,
          employee_count,
          country,
          countries,
          enabled_segments
        `)
        .eq('id', companyId)
        .single()

      if (!companyError) {
        company = companyData
        console.log('Company found:', company?.name)
      } else {
        console.warn('Company not found for ID:', companyId)
      }
    }

    // 4. Fetch products for this provider
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('Products error:', productsError)
    }

// 5. Fetch ALL integrations with company names
let integrations: any[] = []

try {
  // Get all integrations first
  const { data: allIntegrations, error: allError } = await supabase
    .from('integrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (allError) {
    console.error('Error fetching integrations:', allError)
  } else if (allIntegrations && allIntegrations.length > 0) {
    console.log(`Found ${allIntegrations.length} integrations`)
    
    // Extract unique company IDs from BOTH company_id and created_by_company_id
    const companyIds = [
      ...new Set([
        ...allIntegrations.map(i => i.company_id).filter(Boolean),
        ...allIntegrations.map(i => i.created_by_company_id).filter(Boolean)
      ])
    ] as string[]
    
    console.log('Company IDs to fetch:', companyIds)
    
    // Fetch companies for these IDs
    let companiesMap = new Map()
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds)
      
      console.log('Companies fetched:', companies)
      
      if (!companiesError && companies) {
        companies.forEach(c => companiesMap.set(c.id, c.name))
      }
    }
    
    // Map data with company names
    integrations = allIntegrations.map(integration => ({
      id: integration.id,
      company_id: integration.company_id,
      created_by_company_id: integration.created_by_company_id,
      integration_type: integration.integration_type,
      status: integration.status,
      created_at: integration.created_at,
      // Add company names
      company_name: companiesMap.get(integration.company_id) || 'Unknown Company',
      created_by_company_name: companiesMap.get(integration.created_by_company_id) || 'Unknown Company'
    }))
    
    console.log('Final integrations with company names:', integrations)
  } else {
    console.log('No integrations found in database')
  }
} catch (error) {
  console.error('Exception fetching integrations:', error)
}
    // 6. Fetch references for this provider's company (if exists)
    let references = []
    if (companyId) {
      const { data: referencesData, error: referencesError } = await supabase
        .from('company_references')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (!referencesError) {
        references = referencesData || []
      } else {
        console.error('References error:', referencesError)
      }
    }

    // 7. Fetch feature selections for products
    let productFeatures: Record<string, any[]> = {}
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id)
      const { data: featuresData, error: featuresError } = await supabase
        .from('product_feature_selections')
        .select('product_id, feature:features(*)')
        .in('product_id', productIds)

      if (!featuresError && featuresData) {
        // Group features by product
        featuresData.forEach(item => {
          if (!productFeatures[item.product_id]) {
            productFeatures[item.product_id] = []
          }
          if (item.feature) {
            productFeatures[item.product_id].push(item.feature)
          }
        })
      }
    }

    // 8. Fetch feature tags for products
    let productFeatureTags: Record<string, string[]> = {}
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id)
      const { data: tagsData, error: tagsError } = await supabase
        .from('product_feature_tags')
        .select('product_id, tag')
        .in('product_id', productIds)

      if (!tagsError && tagsData) {
        // Group tags by product
        tagsData.forEach(item => {
          if (!productFeatureTags[item.product_id]) {
            productFeatureTags[item.product_id] = []
          }
          productFeatureTags[item.product_id].push(item.tag)
        })
      }
    }

    // 9. Fetch screenshots for products
// 9. Fetch screenshots for products (WITH SIGNED URL)
let productScreenshots: Record<string, any[]> = {}

if (products && products.length > 0) {
  const productIds = products.map(p => p.id)

  const { data: screenshotsData, error: screenshotsError } = await supabase
    .from('product_screenshots')
    .select('*')
    .in('product_id', productIds)
    .order('created_at', { ascending: true })

  if (!screenshotsError && screenshotsData) {
    for (const screenshot of screenshotsData) {
      // 🔑 CREATE SIGNED URL
const { data: signed, error: signedError } = await supabase.storage
  .from('product-screenshots') // ✅ EXACT BUCKET NAME
  .createSignedUrl(screenshot.file_path, 60 * 60)

if (signedError) {
  console.error("Signed URL error:", signedError, screenshot.file_path)
}

      if (!productScreenshots[screenshot.product_id]) {
        productScreenshots[screenshot.product_id] = []
      }

      productScreenshots[screenshot.product_id].push({
        ...screenshot,
        url: signed?.signedUrl || null
      })
    }
  }
}

    // 10. Fetch product modules and categories for features
    let productModules: Record<string, any[]> = {}
    if (Object.keys(productFeatures).length > 0) {
      // Get all unique module IDs from features
      const allModuleIds = Array.from(
        new Set(
          Object.values(productFeatures)
            .flat()
            .map((feature: any) => feature?.module_id)
            .filter(Boolean)
        )
      ) as string[]

      if (allModuleIds.length > 0) {
        const { data: modulesData, error: modulesError } = await supabase
          .from('feature_modules')
          .select(`
            id,
            name,
            category:feature_categories(name)
          `)
          .in('id', allModuleIds)

        if (!modulesError && modulesData) {
          // Create a map for quick lookup
          const modulesMap = new Map(modulesData.map(m => [m.id, m]))
          
          // Group modules by product
          Object.entries(productFeatures).forEach(([productId, features]) => {
            const uniqueModuleIds = [...new Set(features.map((f: any) => f.module_id).filter(Boolean))]
            productModules[productId] = uniqueModuleIds
              .map(moduleId => modulesMap.get(moduleId))
              .filter(Boolean)
          })
        }
      }
    }

    // 11. Calculate statistics
    const stats = {
      productsCount: products?.length || 0,
      integrationsCount: integrations?.length || 0,
      referencesCount: references?.length || 0,
      activeIntegrations: integrations?.filter(i => i.status === 'active').length || 0,
      pendingIntegrations: integrations?.filter(i => i.status === 'pending').length || 0,
      confirmedReferences: references?.filter(r => r.status === 'confirmed').length || 0,
      pendingReferences: references?.filter(r => r.status === 'pending').length || 0
    }

    // 12. Calculate provider completeness score
    const calculateCompleteness = () => {
      let score = 0
      let total = 0
      
      // Provider fields
      if (provider.full_name) { score += 1; total += 1 }
      if (provider.work_email) { score += 1; total += 1 }
      if (provider.company_name) { score += 1; total += 1 }
      if (provider.tell_us_about_company) { score += 1; total += 1 }
      
      // Company fields
      if (company) {
        if (company.website_url) { score += 1; total += 1 }
        if (company.product_summary_long) { score += 1; total += 1 }
        if (company.logo_url) { score += 1; total += 1 }
        if (company.country) { score += 1; total += 1 }
        if (company.city) { score += 1; total += 1 }
      }
      
      // Products
      if (products && products.length > 0) { score += 1; total += 1 }
      
      // References
      const confirmedRefs = references?.filter(r => r.status === 'confirmed').length || 0
      if (confirmedRefs >= 2) { score += 1; total += 1 }
      
      return total > 0 ? Math.round((score / total) * 100) : 0
    }

    // 13. Get days since signup
    const getDaysSinceSignup = () => {
      if (!provider.created_at) return 0
      const signupDate = new Date(provider.created_at)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - signupDate.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Prepare response
    const response = {
      provider: {
        id: provider.id,
        full_name: provider.full_name,
        work_email: provider.work_email,
        phone_number: provider.phone_number,
        company_name: provider.company_name,
        company_original_name: provider.company_original_name,
        company_description: provider.company_description,
        requested_company_name: provider.requested_company_name,
        requested_company_description: provider.requested_company_description,
        tell_us_about_company: provider.tell_us_about_company,
        company_primary_type: provider.company_primary_type,
        claim_status: provider.claim_status,
        is_active: provider.is_active,
        created_at: provider.created_at,
        updated_at: provider.updated_at,
        linked_company_id: provider.linked_company_id,
        // Additional calculated fields
        days_since_signup: getDaysSinceSignup(),
        verification_needed: provider.claim_status === 'pending_verification'
      },
      company: company ? {
        id: company.id,
        name: company.name,
        website_url: company.website_url,
        linkedin_url: company.linkedin_url,
        generic_email: company.generic_email,
        email: company.email,
        country: company.country,
        countries: company.countries,
        city: company.city,
        founded_year: company.founded_year,
        employee_count: company.employee_count,
        primary_type: company.primary_type,
        product_summary_short: company.product_summary_short,
        product_summary_long: company.product_summary_long,
        logo_url: company.logo_url,
        icon_url: company.icon_url,
        enabled_segments: company.enabled_segments,
        created_at: company.created_at,
        updated_at: company.updated_at
      } : null,
      products: (products || []).map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        pricing_model: product.pricing_model,
        free_trial: product.free_trial,
        pricing_info: product.pricing_info,
        primary_type: product.primary_type,
        created_at: product.created_at,
        updated_at: product.updated_at,
        provider_id: product.provider_id,
        features: productFeatures[product.id] || [],
        featureTags: productFeatureTags[product.id] || [],
        modules: productModules[product.id] || [],
        screenshots: productScreenshots[product.id] || []
      })),
      integrations: (integrations || []).map(integration => ({
        id: integration.id,
        company_id: integration.company_id,
          company_name: integration.company_name, // Add this line

        integration_type: integration.integration_type,
        status: integration.status,
        created_at: integration.created_at
      })),
      references: (references || []).map(reference => ({
        id: reference.id,
        segment: reference.segment,
        customer_name: reference.customer_name,
        company_name: reference.company_name,
        email: reference.email,
        website: reference.website,
        status: reference.status,
        created_at: reference.created_at,
        confirmed_at: reference.confirmed_at
      })),
      stats: {
        ...stats,
        completenessScore: calculateCompleteness(),
        hasCompany: !!company,
        hasProducts: (products?.length || 0) > 0,
        hasVerifiedReferences: (references?.filter(r => r.status === 'confirmed').length || 0) >= 2,
        pendingActions: {
          references: references?.filter(r => r.status === 'pending').length || 0,
          integrations: integrations?.filter(i => i.status === 'pending').length || 0
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Unexpected error in dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/integrations
 * Load integrations with company details
 */

// Define types for the response
type IntegrationRow = {
  id: string
  company_id: string
  integration_type: string
  status: string
  created_at: string
  companies: {
    id: string
    name: string
    country: string | null
    countries: string[] | null
  }[]
}

export async function GET() {
  try {
    const supabase = await createClient()

    // First, let's debug by checking what companies exist
    console.log('=== DEBUGGING START ===')
    
    // Get integrations first
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false })

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError)
      return NextResponse.json({ error: integrationsError.message }, { status: 500 })
    }

    console.log('Integrations found:', integrations?.length)
    console.log('Sample integration:', integrations?.[0])

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get company IDs
    const companyIds = integrations
      .map(integration => integration.company_id)
      .filter(Boolean) as string[]

    console.log('Company IDs to fetch:', companyIds)

    // Fetch companies
    let companiesMap = new Map<string, any>()
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, country, countries')
        .in('id', companyIds)

      console.log('Companies fetch error:', companiesError)
      console.log('Companies fetched:', companies?.length)
      console.log('Companies data:', companies)

      if (!companiesError && companies) {
        companies.forEach(company => {
          companiesMap.set(company.id, company)
        })
        console.log('Companies in map:', Array.from(companiesMap.entries()))
      }
    }

    // Normalize data
    const normalized = integrations.map(integration => {
      const company = companiesMap.get(integration.company_id)
      console.log(`For integration ${integration.id}, company_id: ${integration.company_id}, company found:`, company)

      let formattedDate = 'N/A'
      try {
        if (integration.created_at) {
          const date = new Date(integration.created_at)
          formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }
      } catch (err) {
        console.error('Error formatting date:', err)
      }

      return {
        id: integration.id,
        partnerName: company?.name || 'Unknown Company',
        type: integration.integration_type || 'operations',
        status: integration.status || 'pending',
        dateAdded: formattedDate,
        companyId: integration.company_id || '',
        country: company?.country?.trim() || 
                (company?.countries?.length ? company.countries.join(', ') : null),
      }
    })

    console.log('=== DEBUGGING END ===')
    return NextResponse.json({ success: true, data: normalized })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/integrations
 * Add a new integration
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { companyId, type } = body

    if (!companyId || !type) {
      return NextResponse.json(
        { error: 'companyId and type are required' },
        { status: 400 }
      )
    }

    // Use the correct column name: company_id (not source_company_id)
    const integrationData = {
      company_id: companyId,  // CORRECT COLUMN NAME
      integration_type: type,
      status: 'pending',      // Column exists in your schema
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('integrations')
      .insert(integrationData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Integration added successfully'
    })

  } catch (error) {
    console.error('Unexpected error in POST /api/integrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/integrations
 * Remove an integration
 */
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Integration id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Integration deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/integrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        const supabase = supabaseAdmin;
        
        if (id) {
            // Get single company
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', id)
                .single();

            if (companyError) throw companyError;

            // Get providers from company_providers table
            const { data: companyProviders, error: providersError } = await supabase
                .from('company_providers')
                .select('provider_id')
                .eq('company_id', id);

            if (providersError) {
                console.error('Error fetching company providers:', providersError);
            }

            // Get provider details if there are any provider_ids
            let providerNames: string[] = [];
            let providerCount = 0;

            if (companyProviders && companyProviders.length > 0) {
                const providerIds = companyProviders.map(cp => cp.provider_id);
                
                const { data: providers, error: providerDetailsError } = await supabase
                    .from('providers')
                    .select('id, full_name, work_email, claim_status')
                    .in('id', providerIds);

                if (providerDetailsError) {
                    console.error('Error fetching provider details:', providerDetailsError);
                } else {
                    providerNames = providers?.map(p => p.full_name).filter(Boolean) || [];
                    providerCount = providers?.length || 0;
                }
            }

            // Get references
            const { data: references, error: referencesError } = await supabase
                .from('company_references')
                .select('*')
                .eq('company_id', id);

            if (referencesError) throw referencesError;

            // Process the data
            const processedData = {
                ...company,
                claim_status: providerCount > 0 ? 'claimed' : 'unclaimed',
                provider_count: providerCount,
                provider_names: providerNames,
                reference_count: references?.length || 0
            };
            
            return NextResponse.json({ success: true, data: processedData });
        } else {
            // Get total count for pagination
            let countQuery = supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            if (search) {
                countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,generic_email.ilike.%${search}%`);
            }

            const { count, error: countError } = await countQuery;

            if (countError) throw countError;

            // Get paginated companies
            let companiesQuery = supabase
                .from('companies')
                .select('*');

            if (search) {
                companiesQuery = companiesQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,generic_email.ilike.%${search}%`);
            }

            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data: companies, error: companiesError } = await companiesQuery
                .order('created_at', { ascending: false })
                .range(from, to);

            if (companiesError) throw companiesError;

            if (!companies || companies.length === 0) {
                return NextResponse.json({ 
                    success: true, 
                    data: [],
                    count: 0,
                    totalPages: 0,
                    currentPage: page
                });
            }

            // For each company, get provider and reference counts
            const processedData = await Promise.all(companies.map(async (company) => {
                // Get providers from company_providers table
                const { data: companyProviders, error: providersError } = await supabase
                    .from('company_providers')
                    .select('provider_id')
                    .eq('company_id', company.id);

                if (providersError) {
                    console.error('Error fetching company providers for company', company.id, providersError);
                }

                // Get provider details if there are any provider_ids
                let providerNames: string[] = [];
                let providerCount = 0;

                if (companyProviders && companyProviders.length > 0) {
                    const providerIds = companyProviders.map(cp => cp.provider_id);
                    
                    const { data: providers, error: providerDetailsError } = await supabase
                        .from('providers')
                        .select('full_name')
                        .in('id', providerIds);

                    if (providerDetailsError) {
                        console.error('Error fetching provider details for company', company.id, providerDetailsError);
                    } else {
                        providerNames = providers?.map(p => p.full_name).filter(Boolean) || [];
                        providerCount = providers?.length || 0;
                    }
                }

                // Get reference count
                const { count: referenceCount, error: refError } = await supabase
                    .from('company_references')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', company.id);

                if (refError) {
                    console.error('Error fetching reference count for company', company.id, refError);
                }

                return {
                    ...company,
                    claim_status: providerCount > 0 ? 'claimed' : 'unclaimed',
                    provider_count: providerCount,
                    provider_names: providerNames,
                    reference_count: referenceCount || 0
                };
            }));

            return NextResponse.json({ 
                success: true, 
                data: processedData,
                count,
                totalPages: Math.ceil((count || 0) / limit),
                currentPage: page
            });
        }
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = supabaseAdmin;
        const formData = await request.formData();

        // Get the JSON data from formData
        const dataStr = formData.get('data') as string;
        const data = JSON.parse(dataStr);

        // Handle file upload if present - but don't use newCompany.id yet
        const file = formData.get('file') as File | null;
        let logoUrl = null;

        // First, create the company WITHOUT the logo
        const companyData = {
            name: data.companyName,
            website_url: data.website || null,
            linkedin_url: data.linkedin || null,
            email: data.email || null,
            country: data.country || null,
            primary_type: data.primaryType || null,
            product_summary_short: data.productSummaryShort || null,
            product_summary_long: data.productSummaryLong || null,
            logo_url: null, // Set to null initially
            icon_url: null, // Set to null initially
            contact_name: data.contactName || null,
            generic_email: data.generic_email || null,
            founded_year: data.founded_year ? parseInt(data.founded_year, 10) : null,
            record_id_ajl_hs: data.recordId || null,
            primary_type_confidence: data.primaryTypeConfidence || null,
            primary_type_reason: data.primaryTypeReason || null,
            primary_type_sug: data.primaryTypeSug || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Insert the company
        const { data: newCompany, error } = await supabase
            .from('companies')
            .insert(companyData)
            .select()
            .single();

        if (error) throw error;

        // Now handle file upload with the new company ID
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const filePath = `companies/${newCompany.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('company-assets')
                .getPublicUrl(filePath);

            logoUrl = publicUrl;

            // Update the company with the logo URL
            const { error: updateError } = await supabase
                .from('companies')
                .update({
                    logo_url: logoUrl,
                    icon_url: logoUrl
                })
                .eq('id', newCompany.id);

            if (updateError) throw updateError;

            // Update the logo_url in the returned data
            newCompany.logo_url = logoUrl;
            newCompany.icon_url = logoUrl;
        }

        return NextResponse.json({ success: true, data: newCompany });
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = supabaseAdmin;
        const formData = await request.formData();

        const dataStr = formData.get('data') as string;
        const data = JSON.parse(dataStr);
        const companyId = formData.get('id') as string;
        const existingIconUrl = formData.get('existingIconUrl') as string | null;

        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        const file = formData.get('file') as File | null;
        let iconPath = existingIconUrl || null;

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const filePath = `companies/${companyId}/${fileName}`;

            // Upload to company-icons bucket (since your form is for icon)
            const { error: uploadError } = await supabase.storage
                .from('company-logos') // Changed from company-logos to company-icons
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Store the path, not the full URL
            iconPath = filePath;
            console.log('New icon uploaded, path:', iconPath);
        }

        const companyData = {
            name: data.companyName,
            website_url: data.website || null,
            linkedin_url: data.linkedin || null,
            email: data.email || null,
            country: data.country || null,
            primary_type: data.primaryType || null,
            product_summary_short: data.productSummaryShort || null,
            product_summary_long: data.productSummaryLong || null,
            contact_name: data.contactName || null,
            generic_email: data.generic_email || null,
            founded_year: data.founded_year ? parseInt(data.founded_year, 10) : null,
            record_id_ajl_hs: data.recordId || null,
            primary_type_confidence: data.primaryTypeConfidence || null,
            primary_type_reason: data.primaryTypeReason || null,
            primary_type_sug: data.primaryTypeSug || null,
            // Update icon_url with the path
            logo_url: iconPath,
            updated_at: new Date().toISOString(),
        };

        console.log('Updating company with data:', companyData);

        const { data: updatedCompany, error } = await supabase
            .from('companies')
            .update(companyData)
            .eq('id', companyId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: updatedCompany });
    } catch (error: any) {
        console.error('Error updating company:', error);
        return NextResponse.json(
            { error: error?.message || JSON.stringify(error) || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const id = body?.id;

        if (!id) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        const supabase = supabaseAdmin;

        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
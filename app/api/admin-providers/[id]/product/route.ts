import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(
    request: Request,
    { params }: RouteParams
) {
    try {
        const { id: providerId } = await params;
        const supabase = await createClient();

        console.log('🔍 Fetching product for provider:', providerId);
        
        // Fetch the provider's product
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (productError) {
            console.error('❌ Product fetch error:', productError);
            return NextResponse.json({ error: productError.message }, { status: 500 });
        }

        if (!product) {
            return NextResponse.json({
                success: true,
                data: {
                    product_id: null,
                    product_name: '',
                    product_description: '',
                    pricing_model: '',
                    free_trial: 'Not Available',
                    pricing_details: '',
                    primary_product_type: [],
                    product_features: {},
                    feature_tags: [],
                    product_screenshots: []
                }
            });
        }

        console.log('✅ Found product:', {
            product_id: product.id,
            product_name: product.name,
            provider_id: product.provider_id
        });

        // Get feature selections for the product
        const { data: featureSelections } = await supabase
            .from('product_feature_selections')
            .select('feature_id')
            .eq('product_id', product.id);

        // Get feature tags for the product
        const { data: featureTags } = await supabase
            .from('product_feature_tags')
            .select('tag')
            .eq('product_id', product.id);

        // Create features object
        const featuresObject: Record<string, boolean> = {};
        (featureSelections || []).forEach(fs => {
            featuresObject[fs.feature_id] = true;
        });

        // Get primary type ID from the primary_type text
        let primaryTypeId = null;
        if (product.primary_type) {
            const { data: primaryType } = await supabase
                .from('feature_categories')
                .select('id')
                .eq('name', product.primary_type)
                .eq('kind', 'primary_type')
                .maybeSingle();

            if (primaryType) {
                primaryTypeId = primaryType.id;
            }
        }

        // Don't try to generate screenshot URLs here - just return empty array
        // The screenshots will be loaded separately by the admin-screenshots endpoint
        const responseData = {
            product_id: product.id,
            product_name: product.name || '',
            product_description: product.description || '',
            pricing_model: product.pricing_model || '',
            free_trial: product.free_trial ? 'Available' : 'Not Available',
            pricing_details: product.pricing_info || '',
            primary_product_type: primaryTypeId ? [primaryTypeId] : [],
            product_features: featuresObject,
            feature_tags: (featureTags || []).map(ft => ft.tag),
            product_screenshots: [] // Return empty array - screenshots will be loaded separately
        };

        console.log('📦 Final response data:', responseData);

        return NextResponse.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('❌ Error fetching provider product:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
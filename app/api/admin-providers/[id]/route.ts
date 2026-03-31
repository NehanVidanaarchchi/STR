import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
    try {
        // Fix: properly extract the id from params
        const { id: providerId } = await params;

        const supabase = await createClient();
        const body = await request.json();

        // Separate provider data from product data
        const {
            product_id,
            product_name,
            product_description,
            pricing_model,
            free_trial,
            pricing_details,
            primary_product_type,
            product_features,
            feature_tags,
            product_screenshots, // Add this to destructuring
            products,
            ...providerData
        } = body;

        // Remove any fields that don't exist in the providers table
        const cleanProviderData = { ...providerData };
        
        // Remove any product-related fields that might be in providerData
        delete cleanProviderData.products;
        delete cleanProviderData.product_name;
        delete cleanProviderData.product_description;
        delete cleanProviderData.pricing_model;
        delete cleanProviderData.free_trial;
        delete cleanProviderData.pricing_details;
        delete cleanProviderData.primary_product_type;
        delete cleanProviderData.product_features;
        delete cleanProviderData.feature_tags;
        delete cleanProviderData.product_screenshots;
        delete cleanProviderData.product_id;

        // Update provider basic info
        const { data: provider, error: providerError } = await supabase
            .from('providers')
            .update(cleanProviderData)
            .eq('id', providerId)
            .select()
            .single();

        if (providerError) {
            console.error('Provider update error:', providerError);
            return NextResponse.json({ error: providerError.message }, { status: 500 });
        }

        // Get primary type name from ID if provided
        let primaryTypeName = '';
        if (primary_product_type && primary_product_type.length > 0) {
            const { data: primaryType, error: primaryTypeError } = await supabase
                .from('feature_categories')
                .select('name')
                .eq('id', primary_product_type[0])
                .eq('kind', 'primary_type')
                .single();
            
            if (primaryTypeError) {
                console.error('Error fetching primary type:', primaryTypeError);
            } else if (primaryType) {
                primaryTypeName = primaryType.name;
            }
        }

        // Handle product data
        const productData = {
            name: product_name,
            description: product_description,
            pricing_model: pricing_model,
            free_trial: free_trial === 'Available',
            pricing_info: pricing_details,
            primary_type: primaryTypeName || null,
            provider_id: providerId,
            updated_at: new Date().toISOString()
        };

        // Check if product exists
        const { data: existingProduct, error: existingProductError } = await supabase
            .from('products')
            .select('id')
            .eq('provider_id', providerId)
            .maybeSingle();

        if (existingProductError) {
            console.error('Error checking existing product:', existingProductError);
        }

        let productId;

        if (existingProduct) {
            // Update existing product
            const { data: updatedProduct, error: productError } = await supabase
                .from('products')
                .update(productData)
                .eq('id', existingProduct.id)
                .select('id')
                .single();

            if (productError) {
                console.error('Error updating product:', productError);
            } else {
                productId = updatedProduct.id;
            }
        } else {
            // Create new product
            const { data: newProduct, error: productError } = await supabase
                .from('products')
                .insert({
                    ...productData,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (productError) {
                console.error('Error creating product:', productError);
            } else {
                productId = newProduct.id;
            }
        }

        // If we have a product ID, update related data
        if (productId) {
            // Update product features (using product_feature_selections table)
            if (product_features) {
                // Delete existing feature selections
                const { error: deleteFeaturesError } = await supabase
                    .from('product_feature_selections')
                    .delete()
                    .eq('product_id', productId);

                if (deleteFeaturesError) {
                    console.error('Error deleting features:', deleteFeaturesError);
                }

                // Insert new feature selections
                const featuresToInsert = Object.entries(product_features)
                    .filter(([_, selected]) => selected)
                    .map(([featureId]) => ({
                        product_id: productId,
                        feature_id: featureId
                    }));

                if (featuresToInsert.length > 0) {
                    const { error: insertFeaturesError } = await supabase
                        .from('product_feature_selections')
                        .insert(featuresToInsert);

                    if (insertFeaturesError) {
                        console.error('Error inserting features:', insertFeaturesError);
                    }
                }
            }

            // Update feature tags
            if (feature_tags) {
                // Delete existing tags
                const { error: deleteTagsError } = await supabase
                    .from('product_feature_tags')
                    .delete()
                    .eq('product_id', productId);

                if (deleteTagsError) {
                    console.error('Error deleting tags:', deleteTagsError);
                }

                // Insert new tags
                const tagsToInsert = feature_tags.map((tag: string) => ({
                    product_id: productId,
                    tag: tag
                }));

                if (tagsToInsert.length > 0) {
                    const { error: insertTagsError } = await supabase
                        .from('product_feature_tags')
                        .insert(tagsToInsert);

                    if (insertTagsError) {
                        console.error('Error inserting tags:', insertTagsError);
                    }
                }
            }

            // Update product screenshots
            if (product_screenshots && Array.isArray(product_screenshots)) {
                // First, delete existing screenshots
                const { error: deleteScreenshotsError } = await supabase
                    .from('product_screenshots')
                    .delete()
                    .eq('product_id', productId);

                if (deleteScreenshotsError) {
                    console.error('Error deleting screenshots:', deleteScreenshotsError);
                }

                // Filter out empty strings and insert new screenshots
                const validScreenshots = product_screenshots.filter(url => url && url.trim() !== '');
                
                if (validScreenshots.length > 0) {
                    const screenshotsToInsert = validScreenshots.map((url: string, index: number) => {
                        // Extract file_path from URL if it's a full Supabase URL
                        let file_path = url;
                        if (url.includes('product-screenshots')) {
                            // Try to extract the path from the URL
                            const match = url.match(/product-screenshots\/(.+?)(\?|$)/);
                            if (match && match[1]) {
                                file_path = match[1];
                            }
                        }

                        return {
                            product_id: productId,
                            file_path: file_path,
                            user_id: providerId, // Use provider ID as user_id
                            sort_order: index
                        };
                    });

                    const { error: insertScreenshotsError } = await supabase
                        .from('product_screenshots')
                        .insert(screenshotsToInsert);

                    if (insertScreenshotsError) {
                        console.error('Error inserting screenshots:', insertScreenshotsError);
                    }
                }
            }
        }

        // Fetch the updated product data
        const { data: updatedProduct } = await supabase
            .from('products')
            .select('*')
            .eq('provider_id', providerId)
            .maybeSingle();

        // Fetch the updated screenshots
        const { data: updatedScreenshots } = await supabase
            .from('product_screenshots')
            .select('*')
            .eq('product_id', productId)
            .order('sort_order', { ascending: true });

        // Create signed URLs for screenshots (similar to your GET endpoint)
        const screenshotUrls = await Promise.all(
            (updatedScreenshots || []).map(async (screenshot) => {
                if (screenshot.file_path) {
                    const { data: signedData } = await supabase.storage
                        .from('product-screenshots')
                        .createSignedUrl(screenshot.file_path, 60 * 60);
                    
                    return signedData?.signedUrl || '';
                }
                return '';
            })
        ).then(urls => urls.filter(url => url));

        // Return the provider data with product data as separate fields
        return NextResponse.json({
            success: true,
            data: {
                ...provider,
                product_name: updatedProduct?.name || '',
                product_description: updatedProduct?.description || '',
                pricing_model: updatedProduct?.pricing_model || '',
                free_trial: updatedProduct?.free_trial ? 'Available' : 'Not Available',
                pricing_details: updatedProduct?.pricing_info || '',
                primary_product_type: primary_product_type || [],
                product_features: product_features || {},
                feature_tags: feature_tags || [],
                product_id: updatedProduct?.id || null,
                product_screenshots: screenshotUrls
            }
        });
    } catch (error) {
        console.error('Error updating provider:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
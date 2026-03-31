import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch feature categories with kind='catalogue'
        const { data: categories, error: categoriesError } = await supabase
            .from('feature_categories')
            .select(`
                id,
                name,
                description,
                feature_modules (
                    id,
                    name,
                    features (
                        id,
                        name,
                        definition
                    )
                )
            `)
            .eq('kind', 'catalogue')
            .order('name');

        if (categoriesError) {
            return NextResponse.json({ error: categoriesError.message }, { status: 500 });
        }

        // Transform to the structure expected by the modal
        const catalog = categories.map(category => ({
            category: category.name,
            sections: (category.feature_modules || []).map(module => ({
                title: module.name,
                subtext: module.features?.[0]?.definition || 'Features related to ' + module.name,
                items: (module.features || []).map(feature => ({
                    id: feature.id,
                    label: feature.name,
                    subtext: feature.definition
                }))
            }))
        }));

        return NextResponse.json({ success: true, data: catalog });
    } catch (error) {
        console.error('Error fetching feature catalog:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
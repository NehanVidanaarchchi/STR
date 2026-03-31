import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get all unique tags from product_feature_tags
        const { data, error } = await supabase
            .from('product_feature_tags')
            .select('tag')
            .order('tag');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get unique tags
        const uniqueTags = [...new Set(data.map(item => item.tag))];

        return NextResponse.json({ success: true, data: uniqueTags });
    } catch (error) {
        console.error('Error fetching feature tags:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
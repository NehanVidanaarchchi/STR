import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch feature categories with kind='primary_type'
        const { data, error } = await supabase
            .from('feature_categories')
            .select('id, name, description')
            .eq('kind', 'primary_type')
            .order('name');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform to match the format expected by the modal
        const primaryTypes = data.map(type => ({
            id: type.id,
            label: type.name,
            description: type.description || ''
        }));

        return NextResponse.json({ success: true, data: primaryTypes });
    } catch (error) {
        console.error('Error fetching primary types:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
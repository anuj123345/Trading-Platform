import { NextRequest, NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/ai/ingest';

export async function POST(req: NextRequest) {
    try {
        const { text, filename, category } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
        }

        await ingestDocument(text, { filename, category, source: 'user_upload' });

        return NextResponse.json({ status: 'success', message: `Document '${filename || 'unnamed'}' ingested successfully.` });
    } catch (error: any) {
        console.error("Ingestion API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

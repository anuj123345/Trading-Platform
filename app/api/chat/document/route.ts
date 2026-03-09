import { NextRequest, NextResponse } from 'next/server';
import { queryDocumentRAG } from '@/lib/ai/rag-chat';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const result = await queryDocumentRAG(query);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Document Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

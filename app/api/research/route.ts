import { NextRequest, NextResponse } from 'next/server';
import { expandQuery, searchWeb, synthesizeReport } from '@/lib/ai/research-agent';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Expand queries
        const expandedQueries = await expandQuery(query);

        // 2. Search web (Placeholder for now)
        const sources = await searchWeb(expandedQueries);

        // 3. Synthesize report
        const report = await synthesizeReport(query, sources);
        report.expandedQueries = expandedQueries;

        return NextResponse.json(report);
    } catch (error: any) {
        console.error("Research API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

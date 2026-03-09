import { NextRequest, NextResponse } from 'next/server';
import { runCrawlerTask } from '@/lib/ai/crawler';

export async function POST(req: NextRequest) {
    try {
        const { goal, url } = await req.json();

        if (!goal || !url) {
            return NextResponse.json({ error: 'Goal and URL are required' }, { status: 400 });
        }

        const findings = await runCrawlerTask(goal, url);

        return NextResponse.json({ status: 'success', findings });
    } catch (error: any) {
        console.error("Crawler API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

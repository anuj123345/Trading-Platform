import { NextRequest, NextResponse } from 'next/server';
import { runMistakeGuardian } from '@/lib/automation/debug-agent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const results = await runMistakeGuardian();

        const fixedCount = results.filter(r => r.fixed).length;
        const pendingCount = results.filter(r => !r.fixed).length;

        return NextResponse.json({
            success: true,
            message: `Mistake Guardian scan completed. Found ${results.length} issues, automatically fixed ${fixedCount}.`,
            findings: results,
            stats: {
                total: results.length,
                fixed: fixedCount,
                pending: pendingCount
            }
        });
    } catch (error: any) {
        console.error('Debug Agent API Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Use POST to trigger Debug Agent' });
}

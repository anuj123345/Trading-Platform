import { NextRequest, NextResponse } from 'next/server';
import { runInstagramAutomation } from '@/lib/automation/workflow';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // Simple secret check for security (should be set in env)
    const authHeader = req.headers.get('authorization');
    const secret = process.env.AUTOMATION_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const hashtags = body.hashtags || ['blender3d', 'isometric'];

        // Run the automation asynchronously to avoid timeout
        // In a real production app, you might use a background job/worker
        runInstagramAutomation(hashtags).catch(err => {
            console.error('Background automation error:', err);
        });

        return NextResponse.json({
            success: true,
            message: 'Instagram automation triggered successfully in the background.',
            hashtags
        });
    } catch (error: any) {
        console.error('API Route Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Use POST to trigger automation' });
}

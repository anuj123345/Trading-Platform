import { NextRequest, NextResponse } from 'next/server';
import { initializeVectorStore } from '@/lib/ai/vector-store';

export async function POST() {
    try {
        await initializeVectorStore();
        return NextResponse.json({ status: 'success', message: 'Database initialized with vector support' });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

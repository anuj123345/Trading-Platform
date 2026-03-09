import { NextRequest, NextResponse } from "next/server";

interface AlgoState {
    orders: any[];
    positions: any[];
    marginInfo: { cash: number; used: number };
    lastSync: string | null;
}

// Global in-memory storage for the latest algo state
let latestAlgoState: AlgoState = {
    orders: [],
    positions: [],
    marginInfo: { cash: 0, used: 0 },
    lastSync: null
};

export async function GET() {
    return NextResponse.json({
        success: true,
        data: latestAlgoState
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Update the global state with data from the IDE
        latestAlgoState = {
            orders: body.orders || [],
            positions: body.positions || [],
            marginInfo: body.marginInfo || { cash: 0, used: 0 },
            lastSync: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            message: "State synchronized successfully"
        });
    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

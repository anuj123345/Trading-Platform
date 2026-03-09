import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { symbol, keys } = body;

        const activeKeys = keys || {
            user: process.env.SHOONYA_USER,
            pwd: process.env.SHOONYA_PWD,
            apiKey: process.env.SHOONYA_API_KEY,
            vendorCode: process.env.SHOONYA_VENDOR_CODE,
        };

        if (!activeKeys || !activeKeys.user || !activeKeys.apiKey) {
            return NextResponse.json({ success: false, error: "Missing Broker Credentials." }, { status: 400 });
        }

        const pythonScriptPath = path.join(process.cwd(), "lib", "shoonya_quote.py");

        // Prepare payload for Python
        const pythonPayload = Buffer.from(JSON.stringify({
            user: activeKeys.user,
            pwd: activeKeys.pwd,
            apiKey: activeKeys.apiKey,
            vendorCode: activeKeys.vendorCode,
            imei: activeKeys.imei || process.env.SHOONYA_IMEI || "ABC123",
            totpSecret: activeKeys.totpSecret || process.env.SHOONYA_TOTP_SECRET,
            symbol: symbol
        })).toString("base64");

        // Execute Python bridge
        const pythonCmd = process.platform === "win32" ? "python" : "python3";
        console.log(`Executing: ${pythonCmd} "${pythonScriptPath}" [payload]`);

        try {
            const { stdout, stderr } = await execAsync(`${pythonCmd} "${pythonScriptPath}" ${pythonPayload}`);

            if (stdout) console.log("Python Bridge STDOUT:", stdout.trim());
            if (stderr) console.error("Python Bridge STDERR:", stderr.trim());

            if (stderr && !stdout) {
                console.error("Python Bridge Error (STDERR):", stderr);
                return NextResponse.json({ success: false, error: stderr }, { status: 500 });
            }

            const result = JSON.parse(stdout.trim());

            if (!result.success) {
                console.error("Shoonya API Error:", result.error);
                return NextResponse.json({ success: false, error: result.error }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                symbol: result.symbol,
                mockPrice: result.price,
                volume: result.volume
            });
        } catch (execError: any) {
            console.error("Exec Error:", execError.message);
            if (execError.stdout) console.log("Exec STDOUT:", execError.stdout);
            if (execError.stderr) console.error("Exec STDERR:", execError.stderr);
            return NextResponse.json({ success: false, error: execError.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Route Error:", error.message);
        return NextResponse.json({ success: false, error: "Failed to fetch quote" }, { status: 500 });
    }
}

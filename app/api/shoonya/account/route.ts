import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { keys } = body;

        const activeKeys = keys || {
            user: process.env.SHOONYA_USER,
            pwd: process.env.SHOONYA_PWD,
            apiKey: process.env.SHOONYA_API_KEY,
            vendorCode: process.env.SHOONYA_VENDOR_CODE,
        };

        if (!activeKeys || !activeKeys.user || !activeKeys.apiKey) {
            return NextResponse.json({ success: false, error: "Missing Broker Credentials." }, { status: 400 });
        }

        const pythonScriptPath = path.join(process.cwd(), "lib", "shoonya_account.py");

        const pythonPayload = Buffer.from(JSON.stringify({
            user: activeKeys.user,
            pwd: activeKeys.pwd,
            apiKey: activeKeys.apiKey,
            vendorCode: activeKeys.vendorCode,
            imei: activeKeys.imei || process.env.SHOONYA_IMEI || "ABC123",
            totpSecret: activeKeys.totpSecret || process.env.SHOONYA_TOTP_SECRET,
        })).toString("base64");

        const pythonCmd = process.platform === "win32" ? "python" : "python3";
        const { stdout, stderr } = await execAsync(`${pythonCmd} "${pythonScriptPath}" ${pythonPayload}`);

        if (stderr && !stdout) {
            console.error("Python Account Bridge Error:", stderr);
            throw new Error(stderr);
        }

        const result = JSON.parse(stdout.trim());

        if (!result.success) {
            console.error("Shoonya Account API Error:", result.error);
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch account info" }, { status: 500 });
    }
}

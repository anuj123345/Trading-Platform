import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
        const { code, keys } = await req.json();

        if (!code) {
            return NextResponse.json({ success: false, error: "No code provided" }, { status: 400 });
        }

        // 1. Resolve Credentials (Fallback to .env.local if not provided from client)
        const USERID = keys?.user || process.env.SHOONYA_USER;
        const PASSWORD = keys?.pwd || process.env.SHOONYA_PWD;
        const TOKEN = keys?.totp || process.env.SHOONYA_TOTP_SECRET;
        const VENDOR = keys?.vendor || process.env.SHOONYA_VENDOR_CODE;
        const API_SECRET = keys?.apikey || process.env.SHOONYA_API_KEY;
        const IMEI = keys?.imei || process.env.SHOONYA_IMEI;

        if (!USERID || !PASSWORD || !TOKEN || !API_SECRET || !VENDOR || !IMEI) {
            return NextResponse.json({ success: false, error: "Missing Broker Credentials." }, { status: 401 });
        }

        // 2. Prepare Storage Directory
        const algoDir = path.join(process.cwd(), "storage");
        await fs.mkdir(algoDir, { recursive: true });

        // 3. Generate dynamic config.py
        const configContent = `
SHOONYA_USERID = "${USERID}"
SHOONYA_PASSWORD = "${PASSWORD}"
TOKEN = "${TOKEN}"
SHOONYA_VENDOR = "${VENDOR}"
SHOONYA_API_SECRET = "${API_SECRET}"
SHOONYA_IMEI = "${IMEI}"
`;
        await fs.writeFile(path.join(algoDir, "config.py"), configContent);

        // 4. Save the user's strategy script
        const scriptPath = path.join(algoDir, "active_algo.py");
        await fs.writeFile(scriptPath, code);

        // 5. Spawn the detached background process
        // Redirect stdout/stderr to a log file
        const logPath = path.join(algoDir, "algo.log");
        const logStream = await fs.open(logPath, "w");

        // We use 'python' assuming it's in the global PATH.
        const pythonProcess = spawn("python", [scriptPath], {
            cwd: algoDir,
            detached: true,
            stdio: [
                "ignore",       // stdin
                logStream.fd,   // stdout
                logStream.fd    // stderr
            ]
        });

        // Detach the process from the Node event loop
        pythonProcess.unref();
        logStream.close(); // Important: call unref and close the FD on our end

        return NextResponse.json({
            success: true,
            message: "Algorithm successfully deployed and running in background.",
            pid: pythonProcess.pid
        });

    } catch (error: any) {
        console.error("Algo deployment error:", error);
        return NextResponse.json({ success: false, error: "Deployment failed" }, { status: 500 });
    }
}

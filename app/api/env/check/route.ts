import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import fs from "fs/promises";
import path from "path";
import zlib from "zlib";
import { NIFTY_ALGO_SCRIPT } from "@/lib/nifty-script";

const execPromise = promisify(exec);

async function getVSCodeCommand(): Promise<string> {
    try {
        await execPromise(os.platform() === "win32" ? "where code" : "which code");
        return "code";
    } catch (e) {
        if (os.platform() === "win32") {
            const paths = [
                path.join(process.env.LOCALAPPDATA || "", "Programs", "Microsoft VS Code", "bin", "code.cmd"),
                path.join(process.env.ProgramFiles || "", "Microsoft VS Code", "bin", "code.cmd")
            ];
            for (const p of paths) {
                try {
                    await fs.access(p);
                    return `"${p}"`;
                } catch (err) { }
            }
        }
        return "code"; // Default fallback
    }
}

const BACKEND_STRATEGIES: Record<string, string> = {
    "Nifty": NIFTY_ALGO_SCRIPT,
    "Bank Nifty": "# Bank Nifty Breakout Strategy\nimport time\nprint('Monitoring Bank Nifty...')",
    "Sensex": "# Sensex Momentum Strategy\nprint('Running Sensex Momentum...')",
    "Stocks": "# Alpha Stock Picker\nprint('Scanning for Alpha...')",
};

/**
 * Obfuscates Python code by base64 encoding it.
 * Returns a Python script string that decodes and executes the payload.
 *
 * Uses exec(decoded) (no custom dict) so the strategy runs in the launcher's
 * own global namespace — identical to running the script directly. This is
 * critical for correct `global` variable sharing across threads and for
 * `globals()` calls inside sync_to_dashboard() and other functions.
 *
 * The storage directory is prepended to sys.path so `import config` resolves.
 */
function generateLauncherScript(sourceCode: string, projectPath: string): string {
    const base64Payload = Buffer.from(sourceCode + "\n", "utf-8").toString("base64");
    // Use path.join for correct OS path, then use as a raw string in Python
    const storagePath = path.join(projectPath, "storage");

    return `# ==========================================
# SECURE ALGO LAUNCHER
# ==========================================
# Do not modify this file.
# Run this script to execute your strategy.

import base64
import sys
import os

# Ensure the config directory is importable
_storage_path = r"${storagePath}"
if _storage_path not in sys.path:
    sys.path.insert(0, _storage_path)

# Also add the script's own directory (for any local imports)
_script_dir = os.path.dirname(os.path.abspath(__file__))
if _script_dir not in sys.path:
    sys.path.insert(0, _script_dir)

_payload = b"${base64Payload}"

try:
    _decoded = base64.b64decode(_payload).decode('utf-8')
    exec(compile(_decoded, '<strategy>', 'exec'))
except Exception as _e:
    import traceback
    print(f"Execution Error: {_e}")
    traceback.print_exc()
    input("Press Enter to exit...")
`;
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Handle "Open in VS Code" action
        if (body.action === "open") {
            const projectPath = process.env.PROJECT_PATH || process.cwd();
            const filename = body.filename || "strategy_runner.py"; // Default to the runner
            // Use strategyId to get code from backend, bypassing frontend payload
            const strategyId = body.strategyId;
            const rawCode = strategyId ? BACKEND_STRATEGIES[strategyId] : (body.code || "");
            const code = rawCode ? generateLauncherScript(rawCode, projectPath) : "";

            try {
                // Create/Update the strategy file first
                const filePath = path.join(projectPath, filename);
                if (code) {
                    await fs.writeFile(filePath, code);
                }

                // Try to open the project folder AND the specific file
                const codeCmd = await getVSCodeCommand();
                await execPromise(`${codeCmd} "${projectPath}" "${filePath}"`);
                return NextResponse.json({ success: true, message: `File ${filename} created and opened in VS Code` });
            } catch (err) {
                console.error("Failed to launch VS Code via command:", err);
                return NextResponse.json({
                    success: false,
                    error: "Could not launch VS Code or create file. Ensure 'code' is in your PATH."
                }, { status: 500 });
            }
        }

        // Handle "Scan Environment" action
        // Ensure user gave permission (passed as part of the request)
        if (!body.permissionGranted) {
            return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
        }

        const results = {
            python: { installed: false, version: "", installUrl: "https://www.python.org/downloads/" },
            vscode: { installed: false, path: "", installUrl: "https://code.visualstudio.com/" },
            pycharm: { installed: false, installUrl: "https://www.jetbrains.com/pycharm/download/" },
            os: os.platform(),
        };

        // 1. Check Python
        try {
            const { stdout } = await execPromise("python --version");
            results.python.installed = true;
            results.python.version = stdout.trim();
        } catch (e) {
            try {
                // Try hardcoded fallback for common installation paths
                await fs.access("C:\\Python314\\python.exe");
                const { stdout } = await execPromise("C:\\Python314\\python.exe --version");
                results.python.installed = true;
                results.python.version = stdout.trim();
            } catch (e2) {
                try {
                    const { stdout } = await execPromise("python3 --version");
                    results.python.installed = true;
                    results.python.version = stdout.trim();
                } catch (e3) {
                    results.python.installed = false;
                }
            }
        }

        // 2. Check VS Code
        try {
            const cmd = os.platform() === "win32" ? "where code" : "which code";
            const { stdout } = await execPromise(cmd);
            results.vscode.installed = true;
            results.vscode.path = stdout.split('\n')[0].trim();
        } catch (e) {
            // Try hardcoded fallback for VS Code on Windows
            if (os.platform() === "win32") {
                const vscodeLocal = path.join(process.env.LOCALAPPDATA || "", "Programs", "Microsoft VS Code", "bin", "code.cmd");
                try {
                    await fs.access(vscodeLocal);
                    results.vscode.installed = true;
                    results.vscode.path = vscodeLocal;
                } catch (e2) {
                    const vscodeProgramFiles = path.join(process.env.ProgramFiles || "", "Microsoft VS Code", "bin", "code.cmd");
                    try {
                        await fs.access(vscodeProgramFiles);
                        results.vscode.installed = true;
                        results.vscode.path = vscodeProgramFiles;
                    } catch (e3) {
                        results.vscode.installed = false;
                    }
                }
            } else {
                results.vscode.installed = false;
            }
        }

        // 3. Check PyCharm (Common paths on Windows)
        if (os.platform() === "win32") {
            const commonPaths = [
                process.env["ProgramFiles"] + "\\JetBrains",
                process.env["ProgramFiles(x86)"] + "\\JetBrains",
                process.env["LocalAppData"] + "\\JetBrains"
            ];

            // Simple check if JetBrains folder exists as a proxy for PyCharm
            for (const p of commonPaths) {
                try {
                    const { stdout } = await execPromise(`dir "${p}" /b`);
                    if (stdout.toLowerCase().includes("pycharm")) {
                        results.pycharm.installed = true;
                        break;
                    }
                } catch (e) { }
            }
        }

        return NextResponse.json({ success: true, data: results });
    } catch (error: any) {
        console.error("Env check error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

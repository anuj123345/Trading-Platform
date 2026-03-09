import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
    try {
        const logPath = path.join(process.cwd(), "storage", "algo.log");

        try {
            await fs.access(logPath);
        } catch {
            return NextResponse.json({ success: true, logs: "Waiting for logs..." });
        }

        const stats = await fs.stat(logPath);
        const fileSize = stats.size;

        // Read only the last ~10KB of the file for performance
        const readSize = Math.min(fileSize, 1024 * 10);
        const buffer = Buffer.alloc(readSize);

        const fileHandle = await fs.open(logPath, "r");
        await fileHandle.read(buffer, 0, readSize, fileSize - readSize);
        await fileHandle.close();

        const logs = buffer.toString("utf8");

        return NextResponse.json({
            success: true,
            logs: logs
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Failed to read logs" }, { status: 500 });
    }
}

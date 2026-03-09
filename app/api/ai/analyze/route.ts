import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { code, geminiKey } = await req.json();

        const apiKey = geminiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: "Missing Gemini API Key." }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(`Analyze this Python algorithmic trading script for bugs, logical flaws, and performance improvements. Return a short, concise markdown response:\n\n${code}`);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            success: true,
            analysis: text
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: "AI Analysis failed" }, { status: 500 });
    }
}

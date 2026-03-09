import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { code, geminiKey } = await req.json();

        const apiKey = geminiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: "Missing Gemini API Key." }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this Python algorithmic trading script for bugs, logical flaws, and performance improvements. Return a short, concise markdown response:\n\n${code}`,
        });

        return NextResponse.json({
            success: true,
            analysis: response.text
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: "AI Analysis failed" }, { status: 500 });
    }
}

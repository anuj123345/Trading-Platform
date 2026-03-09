import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generates an embedding for a given text using Google's embedding-004 model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error: any) {
        console.error("Error generating embedding:", error.message);
        throw error;
    }
}

/**
 * Generates content using Gemini Pro.
 */
export async function generateContent(prompt: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        console.error("Error generating content:", error.message);
        throw error;
    }
}

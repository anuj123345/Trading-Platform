import { generateEmbedding, generateContent } from './gemini';
import { searchSimilarChunks } from './vector-store';

/**
 * Perform a RAG-powered chat query.
 */
export async function queryDocumentRAG(query: string): Promise<{ answer: string; sources: any[] }> {
    try {
        // 1. Generate query embedding
        const queryEmbedding = await generateEmbedding(query);

        // 2. Search for similar chunks
        const similarChunks = await searchSimilarChunks(queryEmbedding, 5);

        if (similarChunks.length === 0) {
            return {
                answer: "I couldn't find any relevant information in the uploaded documents to answer your question.",
                sources: []
            };
        }

        // 3. Construct prompt with context
        const contextText = similarChunks.map((c, i) => `[Context ${i + 1}]: ${c.content}`).join('\n\n');
        const prompt = `
            You are a Document Analysis Assistant. 
            Context from uploaded documents:
            ${contextText}

            User Question: "${query}"

            Using ONLY the context provided above, answer the user's question accurately. 
            If the answer is not in the context, state that you don't have enough information.
            Provide clear and concise answers.
        `;

        // 4. Generate response
        const answer = await generateContent(prompt);

        return {
            answer,
            sources: similarChunks.map(c => ({ content: c.content, metadata: c.metadata }))
        };
    } catch (error: any) {
        console.error("RAG Query Error:", error);
        throw error;
    }
}

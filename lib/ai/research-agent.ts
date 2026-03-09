import { generateContent } from './gemini';
import { logger } from '../logger';

export interface ResearchSource {
    url: string;
    title: string;
    snippet: string;
    content?: string;
}

export interface ResearchReport {
    originalQuery: string;
    expandedQueries: string[];
    keyFindings: string[];
    detailedAnalysis: string;
    sources: ResearchSource[];
}

/**
 * Expands a single user query into multiple precise search queries.
 */
export async function expandQuery(query: string): Promise<string[]> {
    const prompt = `
        You are a research assistant. The user wants to research: "${query}".
        Generate 4 precise, diverse search queries that would help gather comprehensive information on this topic.
        Return only the queries as a JSON array of strings.
        Example format: ["query 1", "query 2", "query 3", "query 4"]
    `;

    try {
        logger.info(`Expanding query: ${query}`);
        const response = await generateContent(prompt);
        // Clean response in case of markdown formatting
        const cleanResponse = response.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanResponse);
    } catch (error) {
        console.error("Error expanding query:", error);
        return [query]; // Fallback to original query
    }
}

/**
 * Synthesizes a research report from a collection of sources.
 */
export async function synthesizeReport(query: string, sources: ResearchSource[]): Promise<ResearchReport> {
    const sourcesSummary = sources.map((s, i) => `Source ${i + 1}: ${s.title}\nContent: ${s.snippet || s.content?.substring(0, 500)}`).join('\n\n');

    const prompt = `
        You are a Deep Research Agent. 
        Topic: "${query}"
        
        Based on the following source data, generate a comprehensive research report in Markdown.
        INCLUDE:
        1. Key Findings (Bulleted list)
        2. Detailed Analysis
        3. Strategic Recommendations (if applicable)
        4. Citations (linking to the sources provided)

        Source Data:
        ${sourcesSummary}
    `;

    try {
        const reportText = await generateContent(prompt);
        return {
            originalQuery: query,
            expandedQueries: [], // Populated elsewhere if needed
            keyFindings: [], // Can be parsed from reportText if needed
            detailedAnalysis: reportText,
            sources: sources
        };
    } catch (error) {
        console.error("Error synthesizing report:", error);
        throw error;
    }
}

/**
 * Placeholder for web search logic (to be integrated with SerpAPI/Tavily later).
 */
export async function searchWeb(queries: string[]): Promise<ResearchSource[]> {
    console.log("Searching web for queries:", queries);
    // Placeholder results
    return [
        {
            url: "https://example.com/research",
            title: "Simulated Research Paper",
            snippet: "This is a placeholder snippet for the research agent to work with. Real search integration pending API keys."
        }
    ];
}

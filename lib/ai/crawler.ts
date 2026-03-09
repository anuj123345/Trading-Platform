import axios from 'axios';
import { generateContent } from './gemini';

export interface CrawlerResult {
    url: string;
    content: string;
    linksFound: string[];
}

/**
 * Basic tool to fetch page content and extract links.
 */
export async function fetchPage(url: string): Promise<CrawlerResult> {
    try {
        const response = await axios.get(url, { timeout: 10000 });
        const html = response.data;

        // Simple regex to extract links (in a real app, use a proper parser)
        const linkRegex = /href="([^"]*)"/g;
        const links: string[] = [];
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            if (match[1].startsWith('http')) {
                links.push(match[1]);
            }
        }

        // Strip HTML tags for content analysis
        const content = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').substring(0, 10000);

        return { url, content, linksFound: [...new Set(links)] };
    } catch (error: any) {
        console.error(`Error fetching ${url}:`, error.message);
        throw error;
    }
}

/**
 * Autonomous Crawler Agent loop.
 */
export async function runCrawlerTask(goal: string, entryUrl: string, maxSteps: number = 5): Promise<string[]> {
    let currentUrl = entryUrl;
    const history: string[] = [];
    const findings: string[] = [];

    for (let step = 0; step < maxSteps; step++) {
        history.push(currentUrl);
        const { content, linksFound } = await fetchPage(currentUrl);

        const prompt = `
            You are an Autonomous Crawler Agent.
            Goal: "${goal}"
            Current URL: ${currentUrl}
            Page Content (Snippet): ${content.substring(0, 2000)}
            Links Found: ${linksFound.slice(0, 20).join(', ')}

            Based on the content and links, what should be your next step?
            If you found information relevant to the goal, summarize it.
            If you need to continue, provide the URL of the next link to visit from the "Links Found" list.
            Return ONLY a JSON object: {"summary": "what you found", "nextUrl": "URL or null", "done": boolean}
        `;

        try {
            const response = await generateContent(prompt);
            const decision = JSON.parse(response.replace(/```json|```/g, '').trim());

            if (decision.summary) findings.push(decision.summary);
            if (decision.done || !decision.nextUrl) break;

            currentUrl = decision.nextUrl;
        } catch (error) {
            console.error("Crawler decision error:", error);
            break;
        }
    }

    return findings;
}

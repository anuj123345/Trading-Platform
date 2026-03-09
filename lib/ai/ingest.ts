import { generateEmbedding } from './gemini';
import { insertChunk } from './vector-store';
import { logger } from '../logger';

/**
 * Split text into chunks for RAG.
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 100): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.substring(start, end));
        start += (chunkSize - overlap);
    }

    return chunks;
}

/**
 * Process and ingest document text into the vector store.
 */
export async function ingestDocument(text: string, metadata: any = {}): Promise<void> {
    logger.info(`Ingesting document: ${metadata.filename || 'unnamed'}`);
    const chunks = chunkText(text);

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        await insertChunk(chunk, embedding, metadata);
    }
}

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Initializes the database with pgvector extension and necessary tables for RAG.
 */
export async function initializeVectorStore(): Promise<void> {
    const queries = [
        'CREATE EXTENSION IF NOT EXISTS vector;',
        `CREATE TABLE IF NOT EXISTS document_chunks (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            metadata JSONB,
            embedding vector(768), -- Vector size for Gemini text-embedding-004
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,
        'CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);'
    ];

    for (const query of queries) {
        try {
            await pool.query(query);
            console.log(`Executed: ${query.split('(')[0]}...`);
        } catch (error: any) {
            console.error(`Error executing query: ${query}`, error.message);
            // We don't throw for extension creation if we lack superuser, but log it
            if (query.includes('CREATE EXTENSION')) {
                console.warn('Could not ensure pgvector extension. Please ensure it is enabled in your DB.');
            } else {
                throw error;
            }
        }
    }
}

/**
 * Inserts a document chunk with its embedding into the database.
 */
export async function insertChunk(content: string, embedding: number[], metadata: any = {}): Promise<void> {
    const query = 'INSERT INTO document_chunks (content, embedding, metadata) VALUES ($1, $2, $3)';
    const values = [content, `[${embedding.join(',')}]`, JSONB.stringify(metadata)];

    try {
        await pool.query(query, values);
    } catch (error: any) {
        console.error('Error inserting chunk:', error.message);
        throw error;
    }
}

/**
 * Searches for similar document chunks based on an input embedding.
 */
export async function searchSimilarChunks(embedding: number[], limit: number = 5): Promise<any[]> {
    const query = `
        SELECT content, metadata, 1 - (embedding <=> $1) AS similarity
        FROM document_chunks
        ORDER BY embedding <=> $1
        LIMIT $2;
    `;
    const values = [`[${embedding.join(',')}]`, limit];

    try {
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error: any) {
        console.error('Error searching chunks:', error.message);
        throw error;
    }
}

// Helper for JSONB stringification (Postgres expects strings or objects depending on client, usually objects for JSONB with pg)
const JSONB = {
    stringify: (obj: any) => JSON.stringify(obj)
};

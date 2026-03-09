import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export interface ContentRecord {
    id?: number;
    isposted: boolean;
    prompt: string;
    thumbnail_url: string;
    code: string;
    tag: string;
}

/**
 * Checks if a specific content code has already been processed.
 */
export async function isContentProcessed(code: string): Promise<boolean> {
    const query = 'SELECT 1 FROM top_trends WHERE code = $1 LIMIT 1';
    try {
        const result = await pool.query(query, [code]);
        return result.rowCount ? result.rowCount > 0 : false;
    } catch (error: any) {
        console.error('Error checking content existence:', error.message);
        // If table doesn't exist, we might want to create it or just return false
        return false;
    }
}

/**
 * Records processed content in the database.
 */
export async function recordProcessedContent(data: ContentRecord): Promise<void> {
    const query = `
    INSERT INTO top_trends (isposted, prompt, thumbnail_url, code, tag)
    VALUES ($1, $2, $3, $4, $5)
  `;
    const values = [
        data.isposted,
        data.prompt,
        data.thumbnail_url,
        data.code,
        data.tag
    ];

    try {
        await pool.query(query, values);
    } catch (error: any) {
        console.error('Error inserting data into database:', error.message);
        throw error;
    }
}

/**
 * Creates the necessary table if it doesn't exist.
 */
export async function initializeDatabase(): Promise<void> {
    const query = `
    CREATE TABLE IF NOT EXISTS top_trends (
      id SERIAL PRIMARY KEY,
      isposted BOOLEAN DEFAULT false,
      createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updatedat TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deletedat TIMESTAMP WITHOUT TIME ZONE,
      prompt TEXT NOT NULL,
      thumbnail_url TEXT,
      code TEXT,
      tag TEXT
    );
  `;
    try {
        await pool.query(query);
    } catch (error: any) {
        console.error('Error initializing database:', error.message);
        throw error;
    }
}

/**
 * Updates the posting status of a record.
 */
export async function markAsPosted(code: string): Promise<void> {
    const query = 'UPDATE top_trends SET isposted = true, updatedat = CURRENT_TIMESTAMP WHERE code = $1';
    try {
        await pool.query(query, [code]);
    } catch (error: any) {
        console.error('Error marking content as posted:', error.message);
        throw error;
    }
}

import axios from 'axios';

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

const RAPID_API_HOST = 'instagram-scraper-api2.p.rapidapi.com';
const GRAPH_API_VERSION = 'v20.0';

export interface InstagramPost {
    id: string;
    prompt: string;
    content_code: string;
    thumbnail_url: string;
    tag: string;
}

/**
 * Fetches top trending posts for a given hashtag using RapidAPI.
 */
export async function getTopTrends(hashtag: string): Promise<InstagramPost[]> {
    if (!RAPID_API_KEY) throw new Error('RAPID_API_KEY is missing');

    const options = {
        method: 'GET',
        url: `https://${RAPID_API_HOST}/v1/hashtag`,
        params: {
            hashtag: hashtag,
            feed_type: 'top'
        },
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': RAPID_API_HOST
        }
    };

    try {
        const response = await axios.request(options);
        const items = response.data.data.items || [];
        const tagName = response.data.data.additional_data?.name || hashtag;

        return items
            .filter((item: any) => !item.is_video)
            .map((item: any) => ({
                id: item.id,
                prompt: item.caption?.text || '',
                content_code: item.code,
                thumbnail_url: item.thumbnail_url,
                tag: tagName
            }));
    } catch (error: any) {
        console.error(`Error fetching trends for #${hashtag}:`, error.message);
        throw error;
    }
}

/**
 * Creates a media container on Instagram.
 * Returns the creation ID.
 */
export async function createMediaContainer(imageUrl: string, caption: string): Promise<string> {
    if (!INSTAGRAM_BUSINESS_ACCOUNT_ID || !FACEBOOK_ACCESS_TOKEN) {
        throw new Error('Instagram/Facebook credentials missing');
    }

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`;

    try {
        const response = await axios.post(url, null, {
            params: {
                image_url: imageUrl,
                caption: caption,
                access_token: FACEBOOK_ACCESS_TOKEN
            }
        });
        return response.data.id;
    } catch (error: any) {
        console.error('Error creating media container:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Checks the status of a media container.
 */
export async function getMediaStatus(containerId: string): Promise<{ status_code: string; id: string }> {
    if (!FACEBOOK_ACCESS_TOKEN) throw new Error('FACEBOOK_ACCESS_TOKEN is missing');

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${containerId}`;

    try {
        const response = await axios.get(url, {
            params: {
                fields: 'id,status,status_code',
                access_token: FACEBOOK_ACCESS_TOKEN
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('Error checking media status:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Publishes a media container.
 */
export async function publishMedia(containerId: string): Promise<string> {
    if (!INSTAGRAM_BUSINESS_ACCOUNT_ID || !FACEBOOK_ACCESS_TOKEN) {
        throw new Error('Instagram/Facebook credentials missing');
    }

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`;

    try {
        const response = await axios.post(url, null, {
            params: {
                creation_id: containerId,
                access_token: FACEBOOK_ACCESS_TOKEN
            }
        });
        return response.data.id;
    } catch (error: any) {
        console.error('Error publishing media:', error.response?.data || error.message);
        throw error;
    }
}

import { getTopTrends, createMediaContainer, getMediaStatus, publishMedia, InstagramPost } from './instagram';
import { analyzeImage, generateCaption, generateFluxImage } from './ai';
import { isContentProcessed, recordProcessedContent, initializeDatabase, markAsPosted } from './database';
import { sendTelegramNotification } from './notifications';

/**
 * Main orchestration function for the AI Instagram Automation.
 */
export async function runInstagramAutomation(hashtags: string[] = ['blender3d', 'isometric']) {
    try {
        console.log('Starting Instagram Automation Workflow...');
        await sendTelegramNotification('🚀 Instagram Automation Workflow started.');

        // Ensure database is ready
        await initializeDatabase();

        for (const hashtag of hashtags) {
            console.log(`Processing hashtag: #${hashtag}`);
            const trends = await getTopTrends(hashtag);

            console.log(`Found ${trends.length} trending posts for #${hashtag}.`);

            for (const post of trends) {
                // 1. Check if already processed
                const exists = await isContentProcessed(post.content_code);
                if (exists) {
                    console.log(`Skipping post ${post.content_code} - already processed.`);
                    continue;
                }

                console.log(`Processing new post: ${post.content_code}`);

                try {
                    // 2. Record it in DB immediately (to avoid race conditions)
                    await recordProcessedContent({
                        isposted: false,
                        prompt: post.prompt,
                        thumbnail_url: post.thumbnail_url,
                        code: post.content_code,
                        tag: post.tag
                    });

                    // 3. AI Analysis
                    console.log('Analyzing trending image...');
                    const analysis = await analyzeImage(post.thumbnail_url);

                    // 4. Generate new caption
                    console.log('Generating AI caption...');
                    const caption = await generateCaption(analysis);

                    // 5. Generate new image with Flux
                    console.log('Generating new image with Flux...');
                    const newImageUrl = await generateFluxImage(analysis);

                    // 6. Post to Instagram
                    console.log('Creating Instagram media container...');
                    const containerId = await createMediaContainer(newImageUrl, caption);

                    // 7. Wait for media status to be ready (Instagram processing)
                    console.log('Waiting for media container to be ready...');
                    let isReady = false;
                    let attempts = 0;
                    while (!isReady && attempts < 10) {
                        const status = await getMediaStatus(containerId);
                        if (status.status_code === 'FINISHED') {
                            isReady = true;
                        } else if (status.status_code === 'ERROR') {
                            throw new Error('Instagram media processing error');
                        } else {
                            console.log(`Container status: ${status.status_code}, waiting...`);
                            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
                            attempts++;
                        }
                    }

                    if (!isReady) throw new Error('Timeout waiting for Instagram media processing');

                    // 8. Publish
                    console.log('Publishing to Instagram...');
                    await publishMedia(containerId);

                    // 9. Mark as posted in DB
                    await markAsPosted(post.content_code);

                    console.log(`Successfully published post ${post.content_code}!`);
                    await sendTelegramNotification(`✅ Instagram post shared for #${hashtag}!\nPrompt: ${post.content_code}`);

                    // Stop after one successful post per hashtag or total? 
                    // The n8n script seems to process all, but we might want to respect rate limits.
                    // For now, let's process one and move to next hashtag or finish.
                    break;

                } catch (error: any) {
                    console.error(`Error processing post ${post.content_code}:`, error.message);
                    await sendTelegramNotification(`⚠️ Problem processing post ${post.content_code}: ${error.message}`);
                    // Continue to next post
                }
            }
        }

        console.log('Workflow execution completed.');
    } catch (error: any) {
        console.error('Fatal error in workflow:', error.message);
        await sendTelegramNotification(`❌ Fatal error in Instagram Automation: ${error.message}`);
    }
}

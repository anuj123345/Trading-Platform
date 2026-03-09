import OpenAI from 'openai';
import Replicate from 'replicate';

// Lazy initialization helpers to avoid build-time errors when API keys are missing
let _openai: OpenAI | null = null;
let _replicate: Replicate | null = null;

function getOpenAI() {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.");
        }
        _openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return _openai;
}

function getReplicate() {
    if (!_replicate) {
        if (!process.env.REPLICATE_API_TOKEN) {
            throw new Error("Missing credentials. Please set the `REPLICATE_API_TOKEN` environment variable.");
        }
        _replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });
    }
    return _replicate;
}

/**
 * Analyzes an image using GPT-4o-mini vision capabilities.
 */
export async function analyzeImage(imageUrl: string): Promise<string> {
    const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Create a clear and concise description of the object in the image, focusing on its physical and general features. Avoid detailed environmental aspects like background, lighting, or colors. Describe the shape, texture, size, and any unique characteristics of the object. Mention any notable features that make the object stand out, such as its surface details, materials, and design. The description should be focused on the object itself, not its surroundings."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl,
                        },
                    },
                ],
            },
        ],
    });

    return response.choices[0].message.content || '';
}

/**
 * Generates an engaging Instagram caption based on content analysis.
 */
export async function generateCaption(analysis: string): Promise<string> {
    const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a social media expert specializing in 3D art and design."
            },
            {
                role: "user",
                content: `Summarize the following content description into a short, engaging Instagram caption under 150 words. The caption should focus on the content of the image, not the app. Keep it appealing to social media users, and highlight the visual details of the image. Include hashtags relevant to 3D modeling and design, such as #Blender3D, #3DArt, #DigitalArt, #3DModeling, and #ArtCommunity. Ensure the tone is friendly and inviting.

Content description to summarize:
${analysis}

Make sure to craft the caption around the content's features, such as the color contrast, reflective surface, and artistic nature of the image.`
            },
        ],
    });

    return response.choices[0].message.content || '';
}

/**
 * Generates a new image using Flux Schnell based on the analysis.
 */
export async function generateFluxImage(analysis: string): Promise<string> {
    // Clean up the analysis for the prompt
    const cleanAnalysis = analysis
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const prompt = `A highly detailed 3D isometric model of ${cleanAnalysis} rendered in a stylized miniature toy aesthetic. Materials: Matte plastic/painted metal/weathered stone texture with no self-shadowing. Lighting: - Completely shadowless rendering - Ultra bright and perfectly even illumination from all angles - Pure ambient lighting without directional shadows - Flat, consistent lighting across all surfaces - No ambient occlusion. Style specifications: - Clean, defined edges and surfaces - Slightly exaggerated proportions - Miniature/toy-like scale - Subtle wear and texturing - Rich color palette with muted tones - Isometric 3/4 view angle - Crisp details and micro-elements. Technical details: - 4K resolution - PBR materials without shadows - No depth of field - High-quality anti-aliasing - Perfect uniform lighting. Environment: Pure white background with zero shadows or gradients. Post-processing: High key lighting, maximum brightness, shadow removal.`;

    const output: any = await getReplicate().run(
        "black-forest-labs/flux-schnell",
        {
            input: {
                prompt: prompt,
                output_format: "jpg",
                output_quality: 100,
                go_fast: false
            }
        }
    );

    // Replicate returns an array of URLs for this model
    return output[0];
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = "https://generativelanguage.googleapis.com";
const API_KEY = process.env.GEMINI_API_KEY;

async function fetchModels(apiVersion) {
    const res = await fetch(
        `${BASE_URL}/${apiVersion}/models?key=${API_KEY}`
    );
    if (!res.ok) {
        return { version: apiVersion, error: `${res.status} ${res.statusText}` };
    }
    const data = await res.json();
    const models = (data.models || []).map((m) => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods || [],
        supportsEmbedContent: (m.supportedGenerationMethods || []).includes(
            "embedContent"
        ),
    }));

    return {
        version: apiVersion,
        total: models.length,
        embeddingModels: models.filter((m) => m.supportsEmbedContent),
        allModels: models,
    };
}

export async function GET() {
    try {
        const [v1, v1beta] = await Promise.all([
            fetchModels("v1"),
            fetchModels("v1beta"),
        ]);

        return Response.json({
            success: true,
            v1,
            v1beta,
            recommendation:
                [...(v1.embeddingModels || []), ...(v1beta.embeddingModels || [])].map(
                    (m) => m.name
                ),
        });
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

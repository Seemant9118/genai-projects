import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchSimilarChunks } from "@/lib/pdf-analyzer/search";

export async function POST(req) {
    try {
        const { question } = await req.json();

        if (!question?.trim()) {
            return Response.json(
                { success: false, message: "Question is required" },
                { status: 400 }
            );
        }

        // 1️⃣ Retrieve similar chunks
        const chunks = await searchSimilarChunks(question, 5);

        if (!chunks?.length) {
            return Response.json({
                success: true,
                answer: "Not found in the document.",
                sources: [],
            });
        }

        // 2️⃣ Deduplicate by content
        const uniqueChunksMap = new Map();
        for (const chunk of chunks) {
            if (!uniqueChunksMap.has(chunk.content)) {
                uniqueChunksMap.set(chunk.content, chunk);
            }
        }

        const uniqueChunks = Array.from(uniqueChunksMap.values());

        // 3️⃣ Sort by similarity
        const sortedChunks = uniqueChunks.sort(
            (a, b) => b.similarity - a.similarity
        );

        // 4️⃣ Robust similarity logic
        const MAX_CHUNKS = 3;
        const HARD_THRESHOLD = 0.45;
        const MAX_CHARS_PER_CHUNK = 800;

        const topChunks = sortedChunks.slice(0, MAX_CHUNKS);

        const relevantChunks = topChunks.filter(
            (c) => c.similarity >= HARD_THRESHOLD
        );

        const finalChunks =
            relevantChunks.length > 0
                ? relevantChunks
                : [sortedChunks[0]];

        // 5️⃣ Build trimmed context
        const context = finalChunks
            .map(
                (c, i) =>
                    `(${i + 1}) ${c.content.length > MAX_CHARS_PER_CHUNK
                        ? c.content.slice(0, MAX_CHARS_PER_CHUNK)
                        : c.content
                    }`
            )
            .join("\n\n");

        // 6️⃣ Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 300,
            },
        });

        const prompt = `
You are a helpful assistant.
Answer the question ONLY using the provided context.
If the answer is not clearly present, say:
"Not found in the document."
Do not assume or guess.
Keep the answer short and in simple English.

Context:
${context}

Question:
${question}
`;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        return Response.json({
            success: true,
            answer,
            sources: finalChunks.map((c, index) => ({
                index: index + 1,
                similarity: Number(c.similarity.toFixed(3)),
                preview:
                    c.content.length > 200
                        ? c.content.slice(0, 200) + "..."
                        : c.content,
            })),
        });
    } catch (error) {
        console.error("QA ERROR:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
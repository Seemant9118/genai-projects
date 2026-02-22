import { searchSimilarChunks } from "@/lib/pdf-analyzer/search";

export async function POST(req) {
    try {
        const { question, limit = 5 } = await req.json();
        console.log("Question:", question);
        console.log("Limit:", limit);

        if (!question) {
            return Response.json(
                { success: false, message: "Question is required" },
                { status: 400 }
            );
        }

        const results = await searchSimilarChunks(question, limit);
        console.log("Results:", results);
        return Response.json({ success: true, results });

    } catch (error) {
        console.error("Search error:", error);
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
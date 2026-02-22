export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { extractText } from "unpdf";
import { cleanText } from "@/lib/pdf-analyzer/cleanText";
import { chunkText } from "@/lib/pdf-analyzer/chunkText";
import { normalizeExtractedText } from "@/lib/pdf-analyzer/normalizeExtractedText";
import { storeChunks } from "@/lib/pdf-analyzer/storeChunks";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return Response.json(
                { success: false, message: "No file uploaded" },
                { status: 400 }
            );
        }

        // 1. Extract PDF text
        const uint8Array = new Uint8Array(await file.arrayBuffer());
        const { text, pageTexts } = await extractText(uint8Array);

        // Normalize outputs
        const normalizedText = normalizeExtractedText(text);
        const normalizedPageTexts = Array.isArray(pageTexts) ? pageTexts : [];

        // 2. Clean text
        const cleanedText = cleanText(normalizedText);

        // 3. Chunk text
        const chunks = chunkText(cleanedText);

        // 4. Store chunks
        await storeChunks(chunks);

        return Response.json({
            success: true,
            pages: normalizedPageTexts.length,
            chunksCount: chunks.length,
        });

    } catch (error) {
        console.error("PDF ERROR:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
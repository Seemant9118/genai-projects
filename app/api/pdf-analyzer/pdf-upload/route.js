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
        // 1. [EXTRACTION] extract text from pdf
        const uint8Array = new Uint8Array(await file.arrayBuffer());
        // problem: extract types is not fixed, it gives multiple formats array, string etc.
        const { text, pageTexts } = await extractText(uint8Array);
        // solution : normarlize the extracted text
        const normalizedText = normalizeExtractedText(text);

        // 2.[CLEANING] cleaned text
        const cleanedText = cleanText(normalizedText);

        // 3. [CHUNKING] chunking of cleanedText
        const chunks = chunkText(cleanedText);


        // 4. [STORING] chunks storing in db 
        await storeChunks(chunks);

        return Response.json({
            success: true,
            pages: pageTexts.length,
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

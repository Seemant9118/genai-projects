
import { embedText } from "@/lib/pdf-analyzer/embeddings";
import { supabase } from "@/lib/supabase.js";

export async function searchSimilarChunks(question, limit = 5) {
    const queryEmbedding = await embedText(question);

    const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_count: limit,
    });

    if (error) throw error;

    return data; // [{ content, similarity }]
}
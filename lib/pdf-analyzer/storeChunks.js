import { supabase } from "@/lib/supabase";
import { embedText } from "./embeddings";

export async function storeChunks(chunks) {
  const rows = [];

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);

    rows.push({
      content: chunk,
      embedding,
    });
  }

  const { error } = await supabase.from("documents").insert(rows);

  if (error) {
    console.error("Supabase insert error:", error);
    throw error;
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function embedText(text) {
  const embeddings = genAI.getEmbeddingsClient();

  const result = await embeddings.embedContent({
    model: "text-embedding-004",
    content: {
      parts: [{ text }],
    },
  });

  return result.embedding.values; // ✅ length = 768
}

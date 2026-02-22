import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function embedText(text) {
  const model = genAI.getGenerativeModel(
    { model: "gemini-embedding-001" },
    { apiVersion: "v1beta" }
  );

  const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768,
  });

  return result.embedding.values; // length = 768
}

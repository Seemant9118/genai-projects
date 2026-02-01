import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools } from "../../../lib/tool";

export async function POST(req) {
  const { userText } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  // 1) Ask Gemini what action to take
  const decision = await model.generateContent([
    {
      text: `
            You are an AI agent.
            Decide which action to take based on user text.

            Return ONLY valid JSON:
            {
            "action": "recommendSongs | none",
            "params": { "mood": "romantic|sad|happy|angry" }
            }
        `,
    },
    { text: userText },
  ]);

  const content = decision.response.text() || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { action: "none", params: {} };
  }

  // 2) Run tool if needed
  if (parsed.action === "recommendSongs") {
    const result = tools.recommendSongs(parsed.params);
    return Response.json({ success: true, result });
  }

  return Response.json({
    success: true,
    result: { message: "No action needed." },
  });
}

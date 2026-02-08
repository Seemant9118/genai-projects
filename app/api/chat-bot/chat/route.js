import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// normal chat-bot (req,res)
export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: "Messages are required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    const systemPrompt =
      "You are a helpful assistant. Reply in simple English. Do not use markdown symbols like ** or #. Use plain text only.";

    // Convert chat messages into a single prompt string
    const prompt = [
      `System: ${systemPrompt}`,
      ...messages.map(
        (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      ),
    ].join("\n");

    const result = await model.generateContent(prompt);

    const assistantMessage = result?.response?.text() || "";

    return NextResponse.json({
      success: true,
      data: assistantMessage,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

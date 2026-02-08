/* eslint-disable @typescript-eslint/no-unused-vars */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// chatbot (with streamable res)
export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: "Messages are required" },
        { status: 400 }
      );
    }

    // 1) Create Gemini client using API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 2) Select Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    // 3) System Prompt (instruction)
    const systemPrompt =
      "You are a helpful assistant. Reply in simple English. Use plain text only.";

    // 4) Convert chat messages to one prompt (Gemini-friendly)
    const prompt = [
      `System: ${systemPrompt}`,
      ...messages.map((m) => {
        const who = m.role === "user" ? "User" : "Assistant";
        return `${who}: ${m.content}`;
      }),
    ].join("\n");

    // 5) Start Gemini streaming response
    const result = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();

    // 6) Convert Gemini stream → Web ReadableStream (browser streaming)
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text(); // token-like incremental text
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.enqueue(encoder.encode("\n[Streaming error]"));
        } finally {
          controller.close();
        }
      },
    });

    // 7) Return stream response
    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

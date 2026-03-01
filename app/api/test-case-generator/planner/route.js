import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
    try {
        const { goal } = await req.json();

        if (!goal?.trim()) {
            return Response.json(
                { success: false, message: "Goal is required" },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
        });

        const systemPrompt = `
            You are a Planner Agent.
            Your job is to break down the user goal into clear, ordered steps.
            Do NOT execute the steps.
            Do NOT add explanations.
            Return ONLY valid JSON in the following format:

            {
            "goal": "string",
            "steps": [
                { "id": number, "description": "string" }
            ]
            }
            `;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: systemPrompt },
                        { text: goal },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
            },
        });

        const text = result.response.text();
        const plan = JSON.parse(text);

        return Response.json({
            success: true,
            plan,
        });
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
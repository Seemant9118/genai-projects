import { GoogleGenerativeAI } from "@google/generative-ai";
import { executorTools } from "../../../../lib/test-case-generator/executorTools";
import { mapStepToTool } from "../../../../lib/test-case-generator/stepMapper";

export async function POST(req) {
    try {
        const { steps } = await req.json();

        if (!steps || !Array.isArray(steps)) {
            return Response.json(
                { success: false, message: "Steps are required" },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
        });

        const results = [];

        for (const step of steps) {
            // 1. Try deterministic mapper
            let toolName = mapStepToTool(step.description);

            // 2. Fallback to Gemini
            if (!toolName) {
                const prompt = `
                Choose the best tool for the step.

                Available tools:
                ${Object.keys(executorTools).join(", ")}

                Respond ONLY in JSON:
                { "tool": "toolName" | null }

                Step:
                "${step.description}"
                `;

                const result = await model.generateContent(prompt);
                const text = result.response.text();
                const match = text.match(/\{[\s\S]*\}/);
                toolName = match ? JSON.parse(match[0]).tool : null;
            }

            if (!toolName || !executorTools[toolName]) {
                results.push({
                    stepId: step.id,
                    output: "No suitable tool found for this step",
                });
                continue;
            }

            const output = await executorTools[toolName]();

            results.push({
                stepId: step.id,
                toolUsed: toolName,
                output,
            });
        }

        return Response.json({ success: true, results });
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
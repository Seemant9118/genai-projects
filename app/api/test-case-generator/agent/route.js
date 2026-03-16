import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateWithRetry } from "../../../../lib/test-case-generator/generateWithRetry";
import { safeJsonParse } from "../../../../lib/test-case-generator/safeJsonParse";
import { validateTestCases } from "../../../../lib/test-case-generator/validTestCases";

export async function POST(req) {
    try {
        const { feature } = await req.json();

        if (!feature?.trim()) {
            return Response.json(
                { success: false, message: "Feature is required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.3,
            },
        });

        const prompt = `
You are a QA automation expert.
Generate detailed test cases for the given feature.

Rules:
- Cover positive, negative, and edge cases
- Use clear steps
- Do NOT include explanations
- Return ONLY valid JSON in the format:

{
  "feature": "string",
  "testCases": [
    {
      "id": "string",
      "type": "positive|negative|edge",
      "title": "string",
      "steps": ["string"],
      "expectedResult": "string"
    }
  ]
}

Feature:
${feature}
`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const output = safeJsonParse(response);
        let testData = output.success ? output.data : null;

        if (!validateTestCases(testData)) {
            testData = await generateWithRetry(model, prompt);
        }

        if (!validateTestCases(testData)) {
            throw new Error("Could not generate valid test cases");
        }

        return Response.json({
            success: true,
            data: testData,
        });
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

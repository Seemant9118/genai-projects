import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateWithRetry } from "../../../../lib/test-case-generator/generateWithRetry";
import { safeJsonParse } from "../../../../lib/test-case-generator/safeJsonParse";
import { validateTestCases } from "../../../../lib/test-case-generator/validTestCases";

export async function POST(req) {
    try {
        const body = await req.json();

        if (!body || !body.feature || !body.feature.trim()) {
            return Response.json(
                { success: false, message: "Feature is required" },
                { status: 400 }
            );
        }

        const { feature } = body;
        // console.log("Received feature for test case generation:", feature);✅

        if (!process.env.GEMINI_API_KEY) {
            return Response.json(
                { success: false, message: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                temperature: 0.3,
                responseMimeType: "application/json",
            },
        });

        const prompt = `
You are a QA automation expert.

Generate detailed test cases for the given feature.

Rules:
- Cover positive, negative, and edge cases
- Use clear steps
- Do NOT include explanations
- Return ONLY raw JSON
- Do NOT wrap JSON in markdown

JSON format:

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
        // console.log(result);✅
        const responseText = result.response.text();
        // console.log(responseText);✅
        const output = safeJsonParse(responseText);
        console.log(output);
        let testData = output.success ? output.data : null;

        // retry if invalid
        if (!validateTestCases(testData)) {
            testData = await generateWithRetry(model, prompt);
        }

        if (!validateTestCases(testData)) {
            return Response.json(
                {
                    success: false,
                    message: "AI could not generate valid test cases",
                },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            data: testData,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}
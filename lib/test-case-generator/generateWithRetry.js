import { safeJsonParse } from "./safeJsonParse";

export async function generateWithRetry(model, prompt, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        const result = await model.generateContent(prompt);
        const parsed = safeJsonParse(result.response.text());

        if (parsed.success) {
            return parsed.data;
        }

        if (i === retries) {
            throw new Error("Invalid JSON from model");
        }
    }
}

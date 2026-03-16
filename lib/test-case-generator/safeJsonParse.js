export function safeJsonParse(value) {
    if (value && typeof value === "object") {
        return {
            success: true,
            data: value,
        };
    }

    if (typeof value !== "string") {
        return {
            success: false,
            data: null,
        };
    }

    const cleaned = value.replace(/```json|```/gi, "").trim();
    const candidates = [cleaned];
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (match?.[0] && match[0] !== cleaned) {
        candidates.push(match[0]);
    }

    for (const candidate of candidates) {
        try {
            return {
                success: true,
                data: JSON.parse(candidate),
            };
        } catch {
            // Try the next candidate when the model wraps JSON with extra text.
        }
    }

    try {
        return {
            success: true,
            data: JSON.parse(cleaned),
        };
    } catch {
        return {
            success: false,
            data: null,
        };
    }
}

export function safeJsonParse(text) {
    console.log('parsed text', typeof text);
    try {
        return {
            success: true,
            data: JSON.parse(text),
        };
    } catch {
        return {
            success: false,
            data: null,
        };
    }
}

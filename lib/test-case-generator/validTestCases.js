export function validateTestCases(data) {
    if (!data.feature) return false;
    if (!Array.isArray(data.testCases)) return false;

    for (const tc of data.testCases) {
        if (!tc.id || !tc.title || !tc.steps || !tc.expectedResult) {
            return false;
        }
    }

    return true;
}
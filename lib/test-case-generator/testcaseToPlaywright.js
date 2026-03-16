export function convertToPlaywright(testData) {
    const lines = [];
    const hasFeatureTitle = Boolean(testData?.feature?.trim());
    const wrapperIndent = hasFeatureTitle ? "  " : "";

    lines.push(`import { test } from "@playwright/test";`);
    lines.push("");

    if (hasFeatureTitle) {
        lines.push(`test.describe(${JSON.stringify(testData.feature)}, () => {`);
        lines.push("");
    }

    testData.testCases.forEach((tc) => {
        const testName = `${tc.id} - ${tc.title}`;
        lines.push(
            `${wrapperIndent}test(${JSON.stringify(testName)}, async ({ page }) => {`
        );

        tc.steps.forEach((step, index) => {
            lines.push(`${wrapperIndent}  // Step ${index + 1}`);
            lines.push(
                `${wrapperIndent}  // ${String(step).replace(/\r?\n/g, " ")}`
            );
        });

        lines.push("");
        lines.push(`${wrapperIndent}  // Expected Result`);
        lines.push(
            `${wrapperIndent}  // ${String(tc.expectedResult).replace(/\r?\n/g, " ")}`
        );
        lines.push(`${wrapperIndent}});`);
        lines.push("");
    });

    if (hasFeatureTitle) {
        lines.push("});");
        lines.push("");
    }

    return lines.join("\n");
}

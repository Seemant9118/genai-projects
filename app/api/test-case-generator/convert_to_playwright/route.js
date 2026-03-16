import { convertToPlaywright } from "@/lib/test-case-generator/testcaseToPlaywright";

export async function POST(req) {
    try {
        const testData = await req.json();

        if (!testData?.feature || !testData?.testCases) {
            return Response.json(
                { success: false, message: "Invalid test data" },
                { status: 400 }
            );
        }

        const playwrightCode = convertToPlaywright(testData);

        const filename =
            testData.feature
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .toLowerCase() + ".spec.ts";

        return Response.json({
            success: true,
            filename,
            code: playwrightCode,
        });
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

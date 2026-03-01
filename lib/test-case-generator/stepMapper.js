export function mapStepToTool(stepDescription) {
    if (stepDescription.includes("Identify")) return "identifyFields";
    if (stepDescription.includes("positive")) return "generatePositiveTests";
    if (stepDescription.includes("negative")) return "generateNegativeTests";
    return null;
}
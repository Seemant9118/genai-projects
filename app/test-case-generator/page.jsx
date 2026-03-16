"use client";

import Link from "next/link";
import { useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Bot,
    CheckCircle2,
    Copy,
    Download,
    FileCode2,
    FileJson2,
    LoaderCircle,
    Sparkles,
    WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { downloadFile } from "@/lib/test-case-generator/downloadFile";

const FLOW_STEPS = [
    {
        id: "feature",
        title: "Feature",
        description: "Describe the product behavior you want covered.",
        Icon: WandSparkles,
    },
    {
        id: "agent",
        title: "AI Test Case Agent",
        description: "Generate structured QA coverage from the feature.",
        Icon: Bot,
    },
    {
        id: "json",
        title: "JSON Test Cases",
        description: "Review the generated positive, negative, and edge cases.",
        Icon: FileJson2,
    },
    {
        id: "converter",
        title: "Playwright Converter",
        description: "Transform the JSON into a Playwright spec scaffold.",
        Icon: FileCode2,
    },
    {
        id: "download",
        title: ".spec.ts Download",
        description: "Download the generated file and continue implementation.",
        Icon: Download,
    },
];

const SAMPLE_FEATURE = `Build test coverage for a login form where users can sign in with email and password. The form should validate empty fields, reject invalid credentials, support a remember me checkbox, and redirect successful users to the dashboard.`;

const EMPTY_STATUSES = {
    agent: "idle",
    json: "idle",
    converter: "idle",
    download: "idle",
};

function getStepStatusLabel(status) {
    if (status === "loading") return "Running";
    if (status === "success") return "Ready";
    if (status === "error") return "Needs attention";
    return "Waiting";
}

function getStepTone(status) {
    if (status === "loading") {
        return "border-amber-300 bg-amber-50 text-amber-800";
    }

    if (status === "success") {
        return "border-emerald-300 bg-emerald-50 text-emerald-800";
    }

    if (status === "error") {
        return "border-rose-300 bg-rose-50 text-rose-800";
    }

    return "border-slate-200 bg-white/80 text-slate-600";
}

function getStatusIcon(status) {
    if (status === "loading") {
        return <LoaderCircle className="h-4 w-4 animate-spin" />;
    }

    if (status === "success") {
        return <CheckCircle2 className="h-4 w-4" />;
    }

    if (status === "error") {
        return <AlertCircle className="h-4 w-4" />;
    }

    return <Sparkles className="h-4 w-4" />;
}

function formatPreview(value) {
    if (!value) return "";
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

async function parseApiResponse(response) {
    const payload = await response.json();

    if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Something went wrong.");
    }

    return payload;
}

function PreviewPane({ value, emptyMessage }) {
    if (!value) {
        return (
            <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 text-center text-sm text-slate-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <pre className="min-h-80 overflow-auto rounded-3xl border border-slate-200 bg-slate-950 p-5 text-xs leading-6 text-slate-100">
            {formatPreview(value)}
        </pre>
    );
}

export default function TestCaseGeneratorPage() {
    const [feature, setFeature] = useState("");
    const [statuses, setStatuses] = useState(EMPTY_STATUSES);
    const [activeTab, setActiveTab] = useState("json");
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [testData, setTestData] = useState(null);
    const [playwrightCode, setPlaywrightCode] = useState("");
    const [filename, setFilename] = useState("");

    const testCases = testData?.testCases || [];
    const positiveCount = testCases.filter((item) => item.type === "positive").length;
    const negativeCount = testCases.filter((item) => item.type === "negative").length;
    const edgeCount = testCases.filter((item) => item.type === "edge").length;

    const handleGenerate = async () => {
        if (!feature.trim()) {
            toast.error("Describe the feature you want to automate first.");
            return;
        }

        setIsGenerating(true);
        setErrorMessage("");
        setActiveTab("json");
        setTestData(null);
        setPlaywrightCode("");
        setFilename("");
        setStatuses({
            agent: "loading",
            json: "idle",
            converter: "idle",
            download: "idle",
        });

        let failedStage = "agent";

        try {
            const agentResponse = await fetch("/api/test-case-generator/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feature }),
            });

            const agentPayload = await parseApiResponse(agentResponse);

            setTestData(agentPayload.data);
            setStatuses({
                agent: "success",
                json: "success",
                converter: "loading",
                download: "idle",
            });

            failedStage = "converter";

            const converterResponse = await fetch(
                "/api/test-case-generator/convert_to_playwright",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(agentPayload.data),
                }
            );

            const converterPayload = await parseApiResponse(converterResponse);

            setPlaywrightCode(converterPayload.code);
            setFilename(converterPayload.filename);
            setStatuses({
                agent: "success",
                json: "success",
                converter: "success",
                download: "success",
            });
            setActiveTab("code");

            toast.success("Your Playwright starter spec is ready.");
        } catch (error) {
            setErrorMessage(error.message);

            if (failedStage === "converter") {
                setStatuses({
                    agent: "success",
                    json: "success",
                    converter: "error",
                    download: "idle",
                });
            } else {
                setStatuses({
                    agent: "error",
                    json: "idle",
                    converter: "idle",
                    download: "idle",
                });
            }

            toast.error(error.message || "Could not generate the automation pack.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!playwrightCode || !filename) {
            toast.error("Generate the Playwright spec before downloading.");
            return;
        }

        downloadFile(filename, playwrightCode);
        toast.success(`${filename} downloaded.`);
    };

    const handleCopy = async (value, successMessage) => {
        if (!value) return;

        try {
            await navigator.clipboard.writeText(formatPreview(value));
            toast.success(successMessage);
        } catch {
            toast.error("Clipboard copy failed.");
        }
    };

    const handleReset = () => {
        setFeature("");
        setStatuses(EMPTY_STATUSES);
        setActiveTab("json");
        setIsGenerating(false);
        setErrorMessage("");
        setTestData(null);
        setPlaywrightCode("");
        setFilename("");
    };

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f8fafc_38%,#eef2ff_100%)] px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <Button asChild variant="ghost" className="w-fit rounded-full px-0 text-slate-700">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to projects
                        </Link>
                    </Button>

                    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                        <Card className="overflow-hidden border-slate-200 bg-white/85 shadow-xl shadow-orange-100/70">
                            <CardHeader className="gap-4 border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.28),transparent_42%),linear-gradient(135deg,rgba(255,247,237,0.98),rgba(255,255,255,0.95))]">
                                <div className="flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-amber-800">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    AI QA Automation Tool
                                </div>
                                <div className="space-y-3">
                                    <CardTitle className="text-3xl leading-tight text-slate-950 sm:text-4xl">
                                        Turn a feature brief into downloadable Playwright test scaffolding.
                                    </CardTitle>
                                    <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                        This page follows the implementation already in the repo:
                                        feature input goes to the AI test case agent, the agent
                                        returns JSON test cases, the converter turns them into
                                        Playwright, and you can download the generated
                                        <span className="mx-1 font-medium text-slate-900">
                                            .spec.ts
                                        </span>
                                        file from the UI.
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-5 pt-6">
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                    {FLOW_STEPS.map(({ id, title, description, Icon }) => {
                                        const status =
                                            id === "feature"
                                                ? feature.trim()
                                                    ? "success"
                                                    : "idle"
                                                : statuses[id];

                                        return (
                                            <div
                                                key={id}
                                                className={`rounded-3xl border p-4 transition ${getStepTone(status)}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    {getStatusIcon(status)}
                                                </div>

                                                <p className="mt-4 text-sm font-semibold">{title}</p>
                                                <p className="mt-2 text-xs leading-5 opacity-80">
                                                    {description}
                                                </p>
                                                <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] opacity-90">
                                                    {getStepStatusLabel(status)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                                    <div className="space-y-3">
                                        <label
                                            htmlFor="feature"
                                            className="text-sm font-semibold text-slate-900"
                                        >
                                            Feature description
                                        </label>
                                        <Textarea
                                            id="feature"
                                            rows={9}
                                            value={feature}
                                            disabled={isGenerating}
                                            onChange={(event) => setFeature(event.target.value)}
                                            placeholder="Example: Generate test coverage for a signup flow with email verification, password rules, duplicate account validation, and a success redirect to the welcome page."
                                            className="resize-none rounded-3xl border-slate-300 bg-white px-4 py-4 text-sm leading-6 text-slate-900 shadow-none"
                                        />
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <Button
                                                onClick={handleGenerate}
                                                disabled={isGenerating}
                                                className="h-11 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        Building automation pack...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4" />
                                                        Generate automation pack
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => setFeature(SAMPLE_FEATURE)}
                                                disabled={isGenerating}
                                                className="h-11 rounded-full border-slate-300 bg-white"
                                            >
                                                Load sample feature
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                onClick={handleReset}
                                                disabled={isGenerating && !feature}
                                                className="h-11 rounded-full text-slate-700"
                                            >
                                                Reset
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-slate-100">
                                        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                                            Generation snapshot
                                        </p>
                                        <div className="mt-4 grid gap-3">
                                            <div className="rounded-2xl bg-white/5 p-4">
                                                <p className="text-xs text-slate-400">Total test cases</p>
                                                <p className="mt-2 text-3xl font-semibold">
                                                    {testCases.length}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="rounded-2xl bg-emerald-400/10 p-3">
                                                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200">
                                                        Positive
                                                    </p>
                                                    <p className="mt-2 text-xl font-semibold text-white">
                                                        {positiveCount}
                                                    </p>
                                                </div>
                                                <div className="rounded-2xl bg-rose-400/10 p-3">
                                                    <p className="text-[11px] uppercase tracking-[0.2em] text-rose-200">
                                                        Negative
                                                    </p>
                                                    <p className="mt-2 text-xl font-semibold text-white">
                                                        {negativeCount}
                                                    </p>
                                                </div>
                                                <div className="rounded-2xl bg-sky-400/10 p-3">
                                                    <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200">
                                                        Edge
                                                    </p>
                                                    <p className="mt-2 text-xl font-semibold text-white">
                                                        {edgeCount}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <p className="text-xs text-slate-400">Download file</p>
                                                <p className="mt-2 break-all text-sm text-slate-100">
                                                    {filename || "Generated after Playwright conversion"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {errorMessage ? (
                                    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {errorMessage}
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-300/40">
                            <CardHeader>
                                <CardTitle className="text-2xl">What ships from this flow</CardTitle>
                                <CardDescription className="text-slate-300">
                                    The current repo implementation is strongest on generation
                                    and conversion, so the UI leans into that path and gives
                                    quick previews before download.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm leading-6 text-slate-200">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                    <p className="font-semibold text-white">Agent output</p>
                                    <p className="mt-2">
                                        Structured test cases with ids, types, step lists, and
                                        expected results.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                    <p className="font-semibold text-white">Converter output</p>
                                    <p className="mt-2">
                                        A Playwright starter spec scaffold grouped by feature and
                                        ready to refine with selectors and assertions.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-linear-to-br from-amber-400/20 via-orange-300/10 to-transparent p-4">
                                    <p className="font-semibold text-white">Current scope</p>
                                    <p className="mt-2">
                                        Planner and executor endpoints still look experimental, so
                                        this UI focuses on the tested feature-to-spec pipeline you
                                        described.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="border-slate-200 bg-white/85 shadow-xl shadow-indigo-100/70">
                    <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="text-2xl text-slate-950">
                                Review the generated assets
                            </CardTitle>
                            <CardDescription className="mt-2 text-slate-600">
                                JSON is shown first, then the generated Playwright code. You can
                                copy either preview and download the final spec file once it is
                                ready.
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleCopy(testData, "JSON test cases copied.")}
                                disabled={!testData}
                                className="rounded-full border-slate-300 bg-white"
                            >
                                <Copy className="h-4 w-4" />
                                Copy JSON
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    handleCopy(playwrightCode, "Playwright code copied.")
                                }
                                disabled={!playwrightCode}
                                className="rounded-full border-slate-300 bg-white"
                            >
                                <Copy className="h-4 w-4" />
                                Copy code
                            </Button>
                            <Button
                                onClick={handleDownload}
                                disabled={!playwrightCode}
                                className="rounded-full bg-amber-500 px-5 text-slate-950 hover:bg-amber-400"
                            >
                                <Download className="h-4 w-4" />
                                Download spec
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 rounded-full bg-slate-100 p-1">
                                <TabsTrigger value="json" className="rounded-full">
                                    JSON Test Cases
                                </TabsTrigger>
                                <TabsTrigger value="code" className="rounded-full">
                                    Playwright Spec
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="json" className="mt-5">
                                <PreviewPane
                                    value={testData}
                                    emptyMessage="Generate a feature first to inspect the structured JSON test cases."
                                />
                            </TabsContent>

                            <TabsContent value="code" className="mt-5">
                                <PreviewPane
                                    value={playwrightCode}
                                    emptyMessage="Once conversion finishes, the Playwright .spec.ts scaffold will appear here."
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

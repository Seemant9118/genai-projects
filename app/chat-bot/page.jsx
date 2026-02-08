/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_MESSAGES = 10;

export default function ChatPage() {
    const bottomRef = useRef(null);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    const [messages, setMessages] = useState([]);
    const abortRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const tryParseJSON = (text) => {
        try {
            return { ok: true, data: JSON.parse(text) };
        } catch (err) {
            return { ok: false, data: null };
        }
    };

    const streamResponse = async (payloadMessages) => {
        try {
            const controller = new AbortController();
            abortRef.current = controller;

            setIsStreaming(true);

            const res = await fetch("/api/chat-bot/chat-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: payloadMessages }),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error("Failed to stream response.");
            }

            // Add empty assistant message first
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let fullText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Update last assistant message continuously
                setMessages((prev) => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: "assistant", content: fullText };
                    return copy;
                });
            }
        } catch (error) {
            if (error?.name === "AbortError") return;

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Error: " + error.message },
            ]);
        } finally {
            setLoading(false);
            setIsStreaming(false);
            abortRef.current = null;
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: "user", content: input };
        const updatedMessages = [...messages, userMsg];

        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        const trimmedMessages = updatedMessages.slice(-MAX_MESSAGES);
        streamResponse(trimmedMessages);
    };

    const handleRegenerate = async () => {
        if (loading) return;
        if (!messages?.length) return;

        const last = messages[messages.length - 1];
        if (last?.role !== "assistant") return;

        const withoutLastAssistant = messages.slice(0, -1);
        setMessages(withoutLastAssistant);
        setLoading(true);

        const trimmedMessages = withoutLastAssistant.slice(-MAX_MESSAGES);
        streamResponse(trimmedMessages);
    };

    const handleStop = () => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
            setLoading(false);
            setIsStreaming(false);
        }
    };

    const handleClear = () => {
        handleStop();
        setMessages([]);
        setInput("");
        setLoading(false);
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="min-h-screen bg-gray-50 px-3 py-4 sm:p-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col rounded-lg bg-white p-4 sm:p-6 shadow-sm">

                {/* Header */}
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-lg sm:text-xl font-bold text-black">
                        Chat App 💬
                    </h1>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleClear}
                            disabled={loading}
                            className="rounded-md border px-3 py-1 text-sm cursor-pointer text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                            Clear
                        </button>

                        <button
                            onClick={handleRegenerate}
                            disabled={loading || messages.length === 0}
                            className="rounded-md border px-3 py-1 text-sm cursor-pointer text-blue-400 hover:bg-blue-500 hover:text-white disabled:opacity-50"
                        >
                            Regenerate
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="mt-4 flex w-full flex-1 flex-col gap-3 overflow-auto rounded-md bg-gray-100 p-3 sm:p-4 min-h-[55vh] max-h-[65vh]">
                    {isEmpty && !loading ? (
                        <div className="flex h-full items-center justify-center text-center text-sm text-gray-600">
                            No chats yet. 👋 <br />
                            Type something and hit Send.
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`max-w-[85%] sm:max-w-[80%] rounded-md whitespace-pre-wrap px-3 py-2 text-sm wrap-break-word ${msg.role === "user"
                                        ? "ml-auto bg-black text-white"
                                        : "mr-auto bg-white text-gray-900"
                                        }`}
                                >
                                    {msg.role === "assistant" ? (
                                        (() => {
                                            const parsed = tryParseJSON(msg.content);

                                            if (parsed.ok) {
                                                return (
                                                    <>
                                                        <pre className="whitespace-pre-wrap wrap-break-word text-xs bg-black text-white p-2 rounded-sm">
                                                            {JSON.stringify(parsed.data, null, 2)}
                                                        </pre>

                                                        <button
                                                            type="button"
                                                            className="mt-2 rounded-md border px-2 py-1 text-xs cursor-pointer hover:bg-gray-200 transition"
                                                            disabled={loading}
                                                            onClick={async () => {
                                                                try {
                                                                    await navigator.clipboard.writeText(JSON.stringify(parsed.data, null, 2));
                                                                    toast.success("Copied JSON", {
                                                                        duration: 1500,
                                                                    });
                                                                } catch (err) {
                                                                    toast.error(`Copy failed`, {
                                                                        duration: 1500,
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            Copy
                                                        </button>
                                                    </>
                                                );
                                            }

                                            return <div className="whitespace-pre-wrap">{msg.content}</div>;
                                        })()
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Generating text */}
                {isStreaming && (
                    <p className="mt-2 text-xs text-gray-500 italic">
                        Generating response...
                    </p>
                )}

                {/* Input */}
                <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:items-end">
                    <textarea
                        className="w-full flex-1 resize-none rounded-md border px-3 py-2 text-sm outline-none text-black"
                        placeholder="Type a message..."
                        rows={2}
                        value={input}
                        disabled={loading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    <div className="flex w-full sm:w-auto gap-2">
                        {isStreaming ? (
                            <button
                                onClick={handleStop}
                                className="w-full sm:w-auto cursor-pointer rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900"
                            >
                                Stop generating
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="w-full sm:w-auto cursor-pointer rounded-md bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Send
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

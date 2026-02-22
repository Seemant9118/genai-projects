"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PdfChatPage() {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("upload")


  const uploadPdf = async () => {
    if (!file) return alert("Select a PDF first");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    const res = await fetch("/api/pdf-analyzer/pdf-upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) return alert(data.message);

    setUploaded(true);
    alert("PDF uploaded & processed ✅");
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");
    setSources([]);

    const res = await fetch("/api/pdf-analyzer/rag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) return alert(data.message);

    setAnswer(data.answer);
    setSources(data.sources || []);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>AI PDF RAG System 🤖</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue={tab} onValueChange={(v) => setTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload PDF</TabsTrigger>
              <TabsTrigger value="chat">
                Ask PDF
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Upload */}
            <TabsContent value="upload" className="mt-4 space-y-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />

              <Button onClick={uploadPdf} disabled={loading}>
                {loading ? "Uploading..." : "Upload PDF"}
              </Button>
            </TabsContent>

            {/* TAB 2: Ask */}
            <TabsContent value="chat" className="mt-4 space-y-4">
              <Textarea
                rows={3}
                placeholder="Ask a question from the PDF..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <Button onClick={askQuestion} disabled={loading}>
                {loading ? "Thinking..." : "Ask"}
              </Button>

              {/* Answer */}
              {answer && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <b>Answer:</b>
                  <p className="mt-1">{answer}</p>
                </div>
              )}

              {/* Sources */}
              {sources.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Sources</h3>
                  {sources.map((s, idx) => (
                    <div key={idx} className="rounded border p-3 text-xs">
                      <b>Similarity:</b> {s.similarity.toFixed(2)}
                      <p className="mt-1">{s.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
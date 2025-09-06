import React, { useState, useEffect, useRef } from "react";
import { webSearchAndSummarize } from "./Agent";

export default function Chat({ editor }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I can chat or help edit your document.\n\nExamples:\n- Fix grammar of the whole document\n- Rewrite selected text to be shorter\n- Find latest news on Next.js 15 and insert summary",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const wrapAsHtml = (text) => {
    if (!text) return "";
    if (/<[a-z][\s\S]*>/i.test(text)) return text;
    return `<p>${text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .join("</p><p>")}</p>`;
  };

  const callGroqAI = async (messagesForModel) => {
    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messagesForModel,
          temperature: 0.2,
          max_tokens: 1200,
        }),
      }
    );
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || "";
  };

  const detectIntent = (text) => {
    const lower = text.toLowerCase();
    if (
      lower.includes("fix") ||
      lower.includes("edit") ||
      lower.includes("proofread") ||
      lower.includes("improve") ||
      lower.includes("rephrase")
    ) {
      return "edit";
    }
    if (
      lower.includes("insert") ||
      lower.includes("add") ||
      lower.includes("find") ||
      lower.includes("summarize") ||
      lower.includes("news") ||
      lower.includes("search")
    ) {
      return "insert";
    }
    return "chat";
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const intent = detectIntent(input);
      let aiText = "";

      if (intent === "insert") {
        const summary = await webSearchAndSummarize(input);
        aiText = summary;
        const aiMsg = {
          role: "assistant",
          content: aiText,
          meta: { type: "insert" },
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (autoApply && editor) {
          editor.chain().focus().insertContent(wrapAsHtml(aiText)).run();
        }
      } else if (intent === "edit") {
        const fullHtml = editor ? editor.getHTML() : "";
        const system =
          "You are an assistant asked to EDIT the provided HTML document. Return ONLY the edited document as HTML.";
        const messagesForModel = [
          { role: "system", content: system },
          {
            role: "user",
            content: `Please ${input}. Here is the document HTML:\n\n${fullHtml}`,
          },
        ];
        aiText = await callGroqAI(messagesForModel);
        const aiMsg = {
          role: "assistant",
          content: aiText,
          meta: { type: "edit" },
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (autoApply && editor) {
          editor.chain().focus().setContent(aiText).run();
        }
      } else {
        const msgsForModel = [
          {
            role: "system",
            content:
              "You are a helpful assistant. Keep responses conversational unless explicitly asked to edit.",
          },
          ...messages.slice(-6),
          userMsg,
        ];
        aiText = await callGroqAI(msgsForModel);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiText },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const applyMessageToEditor = (msg) => {
    if (!editor) return;
    if (msg.meta?.type === "edit" && msg.content) {
      editor.chain().focus().setContent(msg.content).run();
    } else if (msg.meta?.type === "insert") {
      editor.chain().focus().insertContent(wrapAsHtml(msg.content)).run();
    }
  };

  return (
    <div className="w-96 bg-gradient-to-b from-indigo-50/70 to-purple-50/70 backdrop-blur-xl border-l border-white/30 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg shadow-md flex items-center justify-between">
        🤖 AI Assistant
        <label className="text-xs flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoApply}
            onChange={(e) => setAutoApply(e.target.checked)}
            className="rounded accent-white"
          />
          Auto-apply
        </label>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-br-none"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-bl-none"
              }`}
            >
              {m.content}
              {m.role === "assistant" && m.meta?.type && !autoApply && (
                <div className="mt-2">
                  <button
                    onClick={() => applyMessageToEditor(m)}
                    className="px-2 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30 transition"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/20 flex gap-2 bg-gradient-to-r from-indigo-50/40 to-purple-50/40 backdrop-blur-lg">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask AI or request edits..."
          className="flex-1 px-4 py-2 rounded-full bg-white/70 border border-gray-300 shadow-inner focus:ring-2 focus:ring-indigo-400 outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

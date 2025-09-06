import React, { useEffect, useState } from "react";
import PreviewModal from "./PreviewModal";

export default function FloatingToolbar({ editor }) {
  const [selection, setSelection] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editor) return;
    const onSel = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selectedText = editor.state.doc.textBetween(from, to);
        const coords = editor.view.coordsAtPos(from);
        setSelection({ from, to, text: selectedText, coords });
      } else {
        setSelection(null);
      }
    };
    editor.on("selectionUpdate", onSel);
    return () => editor.off("selectionUpdate", onSel);
  }, [editor]);

  if (!editor || !selection) return null;
  const x = selection.coords.left;
  const y = selection.coords.top - 48;

  const callAI = async (task) => {
    setLoading(true);
    setSuggestion(null);
    try {
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
            messages: [
              {
                role: "system",
                content:
                  "You are an assistant that edits selected text. Return ONLY the edited text.",
              },
              {
                role: "user",
                content: `Task: ${task}\n\nSelected text:\n"""${selection.text}"""`,
              },
            ],
            max_tokens: 800,
            temperature: 0.2,
          }),
        }
      );
      const data = await resp.json();
      const aiText = data?.choices?.[0]?.message?.content?.trim() || "";
      setSuggestion(aiText);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("AI call failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (text) => {
    editor
      .chain()
      .focus()
      .insertContentAt({ from: selection.from, to: selection.to }, text)
      .run();
    setModalOpen(false);
    setSelection(null);
  };

  return (
    <>
      <div
        style={{ position: "absolute", left: x, top: y }}
        className="z-50 flex gap-2 bg-white/70 backdrop-blur-md shadow-lg rounded-full px-3 py-1 border border-gray-200 animate-fadeIn"
      >
        <button
          onClick={() => callAI("Shorten the text while preserving meaning")}
          className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-pink-400 to-red-400 text-white hover:opacity-90 transition"
        >
          Shorten
        </button>
        <button
          onClick={() =>
            callAI("Lengthen the text, add more clarity and examples")
          }
          className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:opacity-90 transition"
        >
          Lengthen
        </button>
        <button
          onClick={() =>
            callAI(
              "Convert into a clean markdown table if data fits tabular format, otherwise output structured bullet points."
            )
          }
          className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:opacity-90 transition"
        >
          Convert
        </button>
        <button
          onClick={() => callAI("Fix grammar and improve clarity; be concise")}
          className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition"
        >
          {loading ? "..." : "AI Edit"}
        </button>
      </div>

      <PreviewModal
        isOpen={modalOpen}
        original={selection?.text}
        suggestion={suggestion}
        onConfirm={() => applySuggestion(suggestion)}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}

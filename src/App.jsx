import React, { useState } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import EditorView from "./components/Editor";
import FloatingToolbar from "./components/FloatingToolbar";
import ChatSideBar from "./components/ChatSideBar";

export default function App() {
  const [content, setContent] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  const applyEdit = (edit) => {
    if (!editor) return;
    if (edit.fullContent !== undefined) {
      editor.chain().focus().setContent(edit.fullContent).run();
      return;
    }
    if (typeof edit.from === "number" && typeof edit.to === "number") {
      editor
        .chain()
        .focus()
        .insertContentAt({ from: edit.from, to: edit.to }, edit.newText)
        .run();
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent(edit.newText || "")
      .run();
  };

  const isEmpty = editor && editor.getText().trim().length === 0; // check empty

  return (
    <div className="h-screen flex bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
      {/* Main editor area */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <header className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🚀 Live Collaborative Editor
            </h1>
          </header>

          <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 p-6 flex-1 overflow-y-auto">
            {/* Placeholder overlay */}
            {isEmpty && (
              <div className="absolute top-6 left-6 text-gray-400 italic pointer-events-none select-none">
                ✍️ Start writing here...
              </div>
            )}

            <EditorView editor={editor} />
            <FloatingToolbar editor={editor} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <ChatSideBar editor={editor} onApplyEdit={applyEdit} />
    </div>
  );
}
